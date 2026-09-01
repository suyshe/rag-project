import { Router, Request, Response } from 'express';
import { searchSimilarChunks } from '../services/ragService.js';
import {
  streamClaudeResponse,
  formatRetrievedContext,
} from '../services/llmService.js';

const router = Router();

// POST /chat/stream - SSE Stream endpoint for RAG chat
router.post('/stream', async (req: Request, res: Response) => {
  const { message, history = [], documentIds } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Query message is required.',
    });
    return;
  }

  // ---------------------------------------------------------
  // SSE headers
  // ---------------------------------------------------------
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.flushHeaders?.();

  // ---------------------------------------------------------
  // IMPORTANT:
  // Do NOT use req.on('close') to mark the SSE response closed.
  // The request can emit "close" while the response is still writable.
  // ---------------------------------------------------------

  let responseFinished = false;

  const sendSSE = (data: unknown): boolean => {
    if (responseFinished || res.writableEnded || res.destroyed) {
      console.log('[SSE BLOCKED]', {
        responseFinished,
        writableEnded: res.writableEnded,
        destroyed: res.destroyed,
      });

      return false;
    }

    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;

      console.log('[SSE SEND]:', data);

      res.write(payload);

      return true;
    } catch (error) {
      console.error('[SSE WRITE ERROR]:', error);
      return false;
    }
  };

  const finishResponse = () => {
    if (responseFinished) {
      return;
    }

    responseFinished = true;

    if (!res.writableEnded) {
      res.end();
    }
  };

  try {
    // ---------------------------------------------------------
    // 1. Retrieve relevant document chunks
    // ---------------------------------------------------------
    const topChunks = await searchSimilarChunks(
      message,
      5,
      documentIds
    );

    const { citations } = formatRetrievedContext(topChunks);

    // ---------------------------------------------------------
    // 2. Send citations
    // ---------------------------------------------------------
    sendSSE({
      type: 'citations',
      citations,
    });

    // ---------------------------------------------------------
    // 3. Stream LLM response
    // ---------------------------------------------------------
    await streamClaudeResponse(
      message,
      history,
      topChunks,

      // Delta
      (textDelta) => {
        sendSSE({
          type: 'delta',
          delta: textDelta,
        });
      },

      // Done
      (fullAnswer) => {
        sendSSE({
          type: 'done',
          fullAnswer,
        });

        finishResponse();
      },

      // Error
      (err) => {
        console.error('[LLM Streaming Error]:', err);

        sendSSE({
          type: 'error',
          error:
            err?.message ||
            'Error occurred while generating the response.',
        });

        finishResponse();
      }
    );
  } catch (error: any) {
    console.error('[Chat RAG Error]:', error);

    sendSSE({
      type: 'error',
      error:
        error?.message ||
        'An unexpected error occurred during RAG retrieval.',
    });

    finishResponse();
  }
});

export default router;
