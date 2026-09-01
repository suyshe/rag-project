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
      defaultHeaders: {
        'anthropic-workspace-id': env.ANTHROPIC_WORKSPACE_ID,
      },
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
      contextText: 'No matching document excerpts were found for this query.',
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
 * Creates the complete prompt sent to either Claude or Ollama.
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
 * Calls Ollama's local chat API and streams the response.
 */
async function streamOllamaResponse(
  userQuery: string,
  history: ChatMessage[],
  chunks: RetrievedChunk[],
  onTextDelta: (delta: string) => void,
  onFinish: (fullText: string) => void,
  onError: (error: any) => void
): Promise<void> {
  const baseUrl = env.OLLAMA_BASE_URL.replace(/\/$/, '');
  const model = env.OLLAMA_CHAT_MODEL || 'llama3.2:3b';

  const userPromptWithContext = buildUserPrompt(userQuery, chunks);

  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    ...history.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: userPromptWithContext,
    },
  ];

  try {
    console.log(`[Ollama] Starting fallback with model: ${model}`);

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Ollama request failed (${response.status}): ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error('Ollama response did not contain a readable stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let accumulatedText = '';
    let finished = false;

    /**
     * Process one Ollama JSON line.
     */
    const processLine = (line: string): boolean => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return false;
      }

      let data: any;

      try {
        data = JSON.parse(trimmedLine);
      } catch {
        console.warn('[Ollama] Could not parse stream line:', trimmedLine);
        return false;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const textDelta = data.message?.content || '';

      if (textDelta) {
        accumulatedText += textDelta;
        onTextDelta(textDelta);
      }

      if (data.done === true) {
        finished = true;
        return true;
      }

      return false;
    };

    while (!finished) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');

      // Keep the incomplete final line in the buffer.
      buffer = lines.pop() || '';

      for (const line of lines) {
        processLine(line);

        if (finished) {
          break;
        }
      }
    }

    /**
     * IMPORTANT:
     * Process the final buffered JSON line.
     *
     * Ollama may close the stream without adding a final newline.
     */
    if (!finished && buffer.trim()) {
      processLine(buffer);
    }

    console.log(
      `[Ollama] Completed successfully. Generated ${accumulatedText.length} characters.`
    );

    onFinish(accumulatedText);
  } catch (error: any) {
    console.error('[Ollama Error]:', error);
    onError(error);
  }
}

/**
 * Streams response from Claude.
 *
 * Claude is the primary provider.
 * If Claude fails, Ollama is automatically used as fallback.
 *
 * Claude output is buffered until Claude successfully finishes so that
 * a partial Claude response is never mixed with an Ollama response.
 */
export async function streamClaudeResponse(
  userQuery: string,
  history: ChatMessage[],
  chunks: RetrievedChunk[],
  onTextDelta: (delta: string) => void,
  onFinish: (fullText: string) => void,
  onError: (error: any) => void
): Promise<void> {
  const userPromptWithContext = buildUserPrompt(userQuery, chunks);

  const recentHistory: Anthropic.MessageParam[] = history
    .slice(-6)
    .map((msg) => ({
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
    env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  let claudeText = '';
  let fallbackStarted = false;

  /**
   * Start Ollama fallback.
   */
  const startOllamaFallback = async (claudeError: any) => {
    if (fallbackStarted) {
      return;
    }

    fallbackStarted = true;

    console.error(
      '[Claude Failed] Switching to Ollama:',
      claudeError?.message || claudeError
    );

    await streamOllamaResponse(
      userQuery,
      history,
      chunks,
      onTextDelta,
      onFinish,
      (ollamaError) => {
        console.error('[Ollama Fallback Failed]:', ollamaError);

        onError(
          new Error(
            `Both Claude and Ollama failed. Claude: ${
              claudeError?.message || 'Unknown Claude error'
            }. Ollama: ${
              ollamaError?.message || 'Unknown Ollama error'
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
      // Claude configuration itself failed.
      await startOllamaFallback(error);
      return;
    }

    console.log(`[Claude] Starting request with model: ${model}`);

    const stream = anthropic.messages.stream({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    stream.on('text', (textDelta) => {
      // IMPORTANT:
      // Do not immediately send Claude chunks to frontend.
      // Buffer them so fallback can safely replace a failed Claude request.
      claudeText += textDelta;
    });

    stream.on('end', () => {
      if (fallbackStarted) {
        return;
      }

      console.log('[Claude] Request completed successfully.');

      // Claude succeeded, so now send the buffered answer to frontend.
      if (claudeText) {
        onTextDelta(claudeText);
      }

      onFinish(claudeText);
    });

    stream.on('error', async (err) => {
      if (fallbackStarted) {
        return;
      }

      await startOllamaFallback(err);
    });
  } catch (err: any) {
    await startOllamaFallback(err);
  }
}