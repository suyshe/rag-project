export interface DocumentItem {
  id: string;
  filename: string;
  file_size: number;
  total_pages: number;
  total_chunks: number;
  status: 'processing' | 'ready' | 'failed';
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Citation {
  index: number;
  id: string;
  documentId: string;
  filename: string;
  pageNumber: number;
  tokenCount: number;
  similarity: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  timestamp: string;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  database: {
    ok: boolean;
    message: string;
    vectorExtension?: boolean;
  };
  config: {
    openaiConfigured: boolean;
    anthropicConfigured: boolean;
    openaiEmbeddingModel: string;
    anthropicModel: string;
    environment: string;
  };
}
