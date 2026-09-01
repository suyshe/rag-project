import { DocumentItem, Citation, HealthStatus } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
 // Proxied via Vite in dev, same-origin in production

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE_URL}/documents`);
  if (!res.ok) {
    throw new Error('Failed to fetch documents');
  }
  const data = await res.json();
  return data.documents || [];
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload document');
  }

  return data.document;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'DELETE',
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete document');
  }
}

export interface StreamChatParams {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  documentIds?: string[];
  signal?: AbortSignal;
  onCitations: (citations: Citation[]) => void;
  onDelta: (textDelta: string) => void;
  onDone: (fullAnswer?: string) => void;
  onError: (errorMsg: string) => void;
}

export async function streamChatQuery({
  message,
  history = [],
  documentIds,
  signal,
  onCitations,
  onDelta,
  onDone,
  onError,
}: StreamChatParams): Promise<void> {
  let receivedDone = false;
  let receivedError = false;

  try {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        documentIds,
      }),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP error ${response.status}`);
    }

    if (!response.body) {
      throw new Error(
        'ReadableStream not supported by browser or response is empty.'
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';

    const processEvent = (event: string) => {
      const trimmed = event.trim();

      if (!trimmed) {
        return;
      }

      // SSE format:
      // data: {"type":"delta","delta":"Hello"}
      const dataLine = trimmed
        .split('\n')
        .find((line) => line.startsWith('data:'));

      if (!dataLine) {
        return;
      }

      const jsonStr = dataLine.replace(/^data:\s*/, '');

      try {
        const payload = JSON.parse(jsonStr);

        console.log('[SSE] Received:', payload);

        if (payload.type === 'citations') {
          onCitations(payload.citations || []);
        } else if (payload.type === 'delta') {
          onDelta(payload.delta || '');
        } else if (payload.type === 'done') {
          receivedDone = true;
          onDone(payload.fullAnswer || '');
        } else if (payload.type === 'error') {
          receivedError = true;
          onError(payload.error || 'An error occurred while generating the response.');
        }
      } catch (parseErr) {
        console.warn(
          '[SSE] Failed to parse payload:',
          jsonStr,
          parseErr
        );
      }
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      console.log('[SSE RAW CHUNK]:', JSON.stringify(buffer));

      // SSE events are separated by a blank line.
      const events = buffer.split(/\r?\n\r?\n/);

      // Keep incomplete event in buffer.
      buffer = events.pop() || '';

      for (const event of events) {
        processEvent(event);
      }
    }

    // Flush any remaining decoder data.
    buffer += decoder.decode();

    // Process final event if one exists.
    if (buffer.trim()) {
      processEvent(buffer);
    }

    // Only call onDone automatically if backend did NOT send a done event.
    if (!receivedDone && !receivedError) {
      console.log('[SSE] Stream ended without explicit done event.');
      onDone();
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Stream aborted by user');
      return;
    }

    console.error('[SSE] Stream connection failed:', err);

    if (!receivedError) {
      onError(err.message || 'Stream connection failed');
    }
  }
}
