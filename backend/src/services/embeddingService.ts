// src/services/embeddingService.ts

import { CohereClientV2 } from 'cohere-ai';
import { env } from '../config/env.js';

let cohereClient: CohereClientV2 | null = null;

function getCohereClient(): CohereClientV2 {
  if (!cohereClient) {
    if (!env.COHERE_API_KEY) {
      throw new Error(
        'COHERE_API_KEY is not configured in environment variables.'
      );
    }

    cohereClient = new CohereClientV2({
      token: env.COHERE_API_KEY,
    });
  }

  return cohereClient;
}

const EMBEDDING_MODEL =
  env.COHERE_EMBEDDING_MODEL || 'embed-v4.0';

const EMBEDDING_DIMENSION = 1536;

/**
 * Generate an embedding for a user query.
 *
 * Uses search_query because this vector will be compared
 * against document embeddings in pgvector.
 */
export async function generateQueryEmbedding(
  text: string
): Promise<number[]> {
  if (!text || !text.trim()) {
    throw new Error(
      'Cannot generate embedding for empty text.'
    );
  }

  const cohere = getCohereClient();

  const response = await cohere.embed({
    model: EMBEDDING_MODEL,

    inputType: 'search_query',

    embeddingTypes: ['float'],

    outputDimension: EMBEDDING_DIMENSION,

    texts: [text.trim()],
  });

  const embedding = response.embeddings?.float?.[0];

  if (!embedding) {
    throw new Error(
      'Cohere returned no query embedding.'
    );
  }

  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Unexpected embedding dimension. Expected ${EMBEDDING_DIMENSION}, received ${embedding.length}.`
    );
  }

  return embedding;
}

/**
 * Generate embeddings for document chunks.
 *
 * Uses search_document because these vectors are stored
 * in the vector database for retrieval.
 */
export async function generateBatchEmbeddings(
  texts: string[],
  batchSize = 50
): Promise<number[][]> {
  if (!texts.length) {
    return [];
  }

  const cleanedTexts = texts
    .map((text) => text.trim())
    .filter(Boolean);

  if (!cleanedTexts.length) {
    return [];
  }

  const cohere = getCohereClient();

  const allEmbeddings: number[][] = [];

  for (
    let i = 0;
    i < cleanedTexts.length;
    i += batchSize
  ) {
    const batch = cleanedTexts.slice(
      i,
      i + batchSize
    );

    console.log(
      `[Embeddings] Generating Cohere embeddings ${i + 1}-${Math.min(
        i + batch.length,
        cleanedTexts.length
      )} of ${cleanedTexts.length}`
    );

    const response = await cohere.embed({
      model: EMBEDDING_MODEL,

      inputType: 'search_document',

      embeddingTypes: ['float'],

      outputDimension: EMBEDDING_DIMENSION,

      texts: batch,
    });

    const batchEmbeddings =
      response.embeddings?.float;

    if (
      !batchEmbeddings ||
      batchEmbeddings.length !== batch.length
    ) {
      throw new Error(
        `Cohere embedding count mismatch. Expected ${batch.length}, received ${
          batchEmbeddings?.length || 0
        }.`
      );
    }

    for (const embedding of batchEmbeddings) {
      if (embedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(
          `Unexpected embedding dimension. Expected ${EMBEDDING_DIMENSION}, received ${embedding.length}.`
        );
      }

      allEmbeddings.push(embedding);
    }
  }

  if (
    allEmbeddings.length !== cleanedTexts.length
  ) {
    throw new Error(
      `Total embedding count mismatch. Expected ${cleanedTexts.length}, received ${allEmbeddings.length}.`
    );
  }

  return allEmbeddings;
}
