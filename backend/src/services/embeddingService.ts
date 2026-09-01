import { env } from '../config/env.js';

const OLLAMA_BASE_URL =
  env.OLLAMA_BASE_URL || 'http://localhost:11434';

const OLLAMA_EMBEDDING_MODEL =
  env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `${OLLAMA_BASE_URL}/api/embeddings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_EMBEDDING_MODEL,
        prompt: text.replace(/\n+/g, ' '),
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama embedding failed: ${response.status} ${errorText}`
    );
  }

  const data = (await response.json()) as {
    embedding?: number[];
  };

  if (!data.embedding) {
    throw new Error('Ollama did not return an embedding.');
  }

  return data.embedding;
}

export async function generateQueryEmbedding(
  queryText: string
): Promise<number[]> {
  return generateEmbedding(queryText);
}

export async function generateBatchEmbeddings(
  texts: string[],
  batchSize = 50
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const embeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}