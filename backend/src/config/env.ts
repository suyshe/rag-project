import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from backend directory or parent directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  OLLAMA_CHAT_MODEL: z.string().default('llama3.2:3b'),

  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_EMBEDDING_MODEL: z.string().default('nomic-embed-text'),

  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  ANTHROPIC_WORKSPACE_ID: z.string().min(1, 'ANTHROPIC_WORKSPACE_ID is required'),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),

  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingKeys = error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');

    console.warn(
      `[Config Warning] Missing or invalid environment variables: ${missingKeys}`
    );
  }

  validatedEnv = {
    DATABASE_URL: process.env.DATABASE_URL || '',

    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_EMBEDDING_MODEL:
      process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',

    OLLAMA_BASE_URL:
      process.env.OLLAMA_BASE_URL || 'http://localhost:11434',

    OLLAMA_EMBEDDING_MODEL:
      process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',

    OLLAMA_CHAT_MODEL:
      process.env.OLLAMA_CHAT_MODEL || 'llama3.2:3b',

    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

    ANTHROPIC_WORKSPACE_ID:
      process.env.ANTHROPIC_WORKSPACE_ID || '',

    ANTHROPIC_MODEL:
      process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',

    PORT: Number(process.env.PORT) || 5000,

    FRONTEND_URL:
      process.env.FRONTEND_URL || 'http://localhost:5173',

    NODE_ENV:
      (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
      'development',
  };
}

export const env = validatedEnv;