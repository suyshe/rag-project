import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { RetrievedChunk } from './ragService.js';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured in environment variables.'
      );
    }

    anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      defaultHeaders: env.ANTHROPIC_WORKSPACE_ID
        ? {
            'anthropic-workspace-id': env.ANTHROPIC_WORKSPACE_ID,
          }
        : undefined,
    });
  }

  return anthropicClient;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CitationInfo {
  index: number;
  id: string;
  documentId: string;
  filename: string;
  pageNumber: number;
  tokenCount: number;
  similarity: number;
  snippet: string;
}

/**
 * Builds numbered source citations from retrieved chunks.
 */
export function formatRetrievedContext(chunks: RetrievedChunk[]): {
  contextText: string;
  citations: CitationInfo[];
} {
  if (!chunks || chunks.length === 0) {
    return {
      contextText:
        'No matching document excerpts were found for this query.',
      citations: [],
    };
  }

  const citations: CitationInfo[] = [];
  const contextParts: string[] = [];

  chunks.forEach((chunk, i) => {
    const citationIndex = i + 1;

    citations.push({
      index: citationIndex,
      id: chunk.id,
      documentId: chunk.documentId,
      filename: chunk.filename,
      pageNumber: chunk.pageNumber,
      tokenCount: chunk.tokenCount,
      similarity: chunk.similarity,
      snippet: chunk.content,
    });

    contextParts.push(
      `[${citationIndex}] Source Document: ${chunk.filename} (Page ${chunk.pageNumber})\n${chunk.content}`
    );
  });

  return {
    contextText: contextParts.join('\n\n---\n\n'),
    citations,
  };
}

const SYSTEM_PROMPT = `You are a precise, reliable AI assistant that answers questions strictly and exclusively based on the provided document excerpts.

CRITICAL INSTRUCTIONS:
1. Grounding: Rely ONLY on the clear facts directly mentioned in the "Document Excerpts" section. Do NOT infer, fabricate, or extrapolate beyond the provided text.
2. Missing Information: If the provided excerpts do not contain sufficient information to answer the question, state: "Based on the provided documents, I do not have enough information to answer this question."
3. Citations: You MUST cite your sources using bracketed numbers like [1], [2], etc., matching the numbered document excerpts provided in context. Place citations immediately following the relevant factual sentence or bullet point.
4. Style: Provide a concise, well-structured answer formatted with clear Markdown headers, lists, or bold text when appropriate.`;

/**
 * Builds the prompt containing the retrieved RAG context.
 */
function buildUserPrompt(
  userQuery: string,
  chunks: RetrievedChunk[]
): string {
  const { contextText } = formatRetrievedContext(chunks);

  return `Document Excerpts:
${contextText}

User Question:
${userQuery}`;
}

/**
 * Streams a response from Gemini.
 *
 * Gemini is used only when Claude fails.
 *
 * The same RAG context and conversation history used by Claude
 * are passed to Gemini.
 */
async function streamGeminiResponse(
  userQuery: string,
  history: ChatMessage[],
  chunks: RetrievedChunk[],
  onTextDelta: (delta: string) => void,
  onFinish: (fullText: string) => void,
  onError: (error: any) => void
): Promise<void> {
  if (!env.GEMINI_API_KEY) {
    onError(
      new Error(
        'GEMINI_API_KEY is not configured in environment variables.'
      )
    );
    return;
  }

  const model = env.GEMINI_MODEL || 'gemini-3.7-flash';

  const userPromptWithContext = buildUserPrompt(
    userQuery,
    chunks
  );

  /**
   * Gemini uses a different message structure from Anthropic.
   *
   * We preserve the existing last 6 messages.
   */
  const contents = [
    ...history.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: msg.content,
        },
      ],
    })),

    {
      role: 'user',
      parts: [
        {
          text: userPromptWithContext,
        },
      ],
    },
  ];

  try {
    console.log(
      `[Gemini] Starting fallback with model: ${model}`
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(
        env.GEMINI_API_KEY
      )}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: SYSTEM_PROMPT,
              },
            ],
          },

          contents,

          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Gemini request failed (${response.status}): ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error(
        'Gemini response did not contain a readable stream.'
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let accumulatedText = '';

    /**
     * Process a single SSE line.
     */
    const processLine = (line: string): void => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith(':')) {
        return;
      }

      if (!trimmedLine.startsWith('data:')) {
        return;
      }

      const jsonText = trimmedLine
        .slice('data:'.length)
        .trim();

      if (!jsonText) {
        return;
      }

      let data: any;

      try {
        data = JSON.parse(jsonText);
      } catch {
        console.warn(
          '[Gemini] Could not parse SSE line:',
          jsonText
        );
        return;
      }

      if (data.error) {
        throw new Error(
          data.error.message ||
            JSON.stringify(data.error)
        );
      }

      const textDelta =
        data.candidates?.[0]?.content?.parts
          ?.map((part: any) => part.text || '')
          .join('') || '';

      if (textDelta) {
        accumulatedText += textDelta;
        onTextDelta(textDelta);
      }
    };

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split('\n');

      // Keep incomplete line.
      buffer = lines.pop() || '';

      for (const line of lines) {
        processLine(line);
      }
    }

    // Process final buffered line.
    if (buffer.trim()) {
      processLine(buffer);
    }

    console.log(
      `[Gemini] Fallback completed successfully. Generated ${accumulatedText.length} characters.`
    );

    onFinish(accumulatedText);
  } catch (error: any) {
    console.error('[Gemini Error]:', error);

    onError(error);
  }
}

/**
 * Streams a response from Claude.
 *
 * Claude is the PRIMARY provider.
 *
 * If Claude fails before completing, Gemini automatically becomes
 * the fallback provider.
 *
 * Claude output is buffered until Claude successfully finishes.
 * This prevents partial Claude output from being mixed with Gemini.
 */
export async function streamClaudeResponse(
  userQuery: string,
  history: ChatMessage[],
  chunks: RetrievedChunk[],
  onTextDelta: (delta: string) => void,
  onFinish: (fullText: string) => void,
  onError: (error: any) => void
): Promise<void> {
  const userPromptWithContext = buildUserPrompt(
    userQuery,
    chunks
  );

  const recentHistory: Anthropic.MessageParam[] =
    history.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  const messages: Anthropic.MessageParam[] = [
    ...recentHistory,
    {
      role: 'user',
      content: userPromptWithContext,
    },
  ];

  const model =
    env.ANTHROPIC_MODEL ||
    'claude-3-5-sonnet-20241022';

  let claudeText = '';
  let fallbackStarted = false;

  /**
   * Start Gemini fallback.
   */
  const startGeminiFallback = async (
    claudeError: any
  ) => {
    if (fallbackStarted) {
      return;
    }

    fallbackStarted = true;

    console.error(
      '[Claude Failed] Switching to Gemini:',
      claudeError?.message ||
        claudeError
    );

    await streamGeminiResponse(
      userQuery,
      history,
      chunks,
      onTextDelta,
      onFinish,
      (geminiError) => {
        console.error(
          '[Gemini Fallback Failed]:',
          geminiError
        );

        onError(
          new Error(
            `Both Claude and Gemini failed. Claude: ${
              claudeError?.message ||
              'Unknown Claude error'
            }. Gemini: ${
              geminiError?.message ||
              'Unknown Gemini error'
            }`
          )
        );
      }
    );
  };

  try {
    let anthropic: Anthropic;

    try {
      anthropic = getAnthropicClient();
    } catch (error) {
      // Claude configuration failed.
      await startGeminiFallback(error);
      return;
    }

    console.log(
      `[Claude] Starting request with model: ${model}`
    );

    const stream = anthropic.messages.stream({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    stream.on('text', (textDelta) => {
      /**
       * IMPORTANT:
       * Buffer Claude output.
       *
       * If Claude fails, we don't want the frontend to receive
       * half of a Claude answer followed by a Gemini answer.
       */
      claudeText += textDelta;
    });

    stream.on('end', () => {
      if (fallbackStarted) {
        return;
      }

      console.log(
        '[Claude] Request completed successfully.'
      );

      /**
       * Claude succeeded.
       *
       * Send the buffered answer to the frontend now.
       */
      if (claudeText) {
        onTextDelta(claudeText);
      }

      onFinish(claudeText);
    });

    stream.on('error', async (err) => {
      if (fallbackStarted) {
        return;
      }

      await startGeminiFallback(err);
    });
  } catch (err: any) {
    await startGeminiFallback(err);
  }
}
