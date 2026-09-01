import { query } from '../db/index.js';
import { extractPdfText } from './pdfService.js';
import { createTokenAwareChunks, DocumentChunk } from './chunkService.js';
import { generateBatchEmbeddings, generateQueryEmbedding } from './embeddingService.js';

export interface RetrievedChunk {
  id: string;
  documentId: string;
  filename: string;
  chunkIndex: number;
  content: string;
  pageNumber: number;
  tokenCount: number;
  similarity: number;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  file_size: number;
  total_pages: number;
  total_chunks: number;
  status: 'processing' | 'ready' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Ingests and processes a PDF file: extracts text, chunks with token awareness,
 * generates OpenAI embeddings, and persists everything into PostgreSQL with pgvector.
 */
export async function processAndStorePdf(
  documentId: string,
  buffer: Buffer
): Promise<void> {
  try {
    // 1. Extract text and page structures
    const parsedPdf = await extractPdfText(buffer);

    if (!parsedPdf.pages || parsedPdf.pages.length === 0 || !parsedPdf.fullText.trim()) {
      throw new Error('PDF file appears to be empty or contains non-extractable text.');
    }

    // 2. Generate token-aware 500-token chunks with 50-token overlap
    const chunks: DocumentChunk[] = createTokenAwareChunks(parsedPdf.pages, 500, 50);

    if (chunks.length === 0) {
      throw new Error('No valid text chunks could be created from this document.');
    }

    // 3. Generate OpenAI embeddings for all chunks in batch
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateBatchEmbeddings(chunkTexts, 50);

    // 4. Save chunks and embeddings into PostgreSQL
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embeddingVector = `[${embeddings[i].join(',')}]`;

      await query(
        `
        INSERT INTO document_chunks 
          (document_id, chunk_index, content, page_number, token_count, embedding)
        VALUES 
          ($1, $2, $3, $4, $5, $6::vector)
        `,
        [
          documentId,
          chunk.chunkIndex,
          chunk.content,
          chunk.pageNumber,
          chunk.tokenCount,
          embeddingVector,
        ]
      );
    }

    // 5. Update document status to ready
    await query(
      `
      UPDATE documents
      SET 
        status = 'ready',
        total_pages = $1,
        total_chunks = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [parsedPdf.totalPages, chunks.length, documentId]
    );

    console.log(
      `[RAG] Document ${documentId} processed successfully (${parsedPdf.totalPages} pages, ${chunks.length} chunks)`
    );
  } catch (error: any) {
    console.error(`[RAG Error] Failed to process document ${documentId}:`, error);

    await query(
      `
      UPDATE documents
      SET 
        status = 'failed',
        error_message = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [error.message || 'Unknown processing error', documentId]
    );

    throw error;
  }
}

/**
 * Searches for the top 5 most similar document chunks using cosine similarity via pgvector.
 */
export async function searchSimilarChunks(
  userQuery: string,
  topK = 5,
  documentIds?: string[]
): Promise<RetrievedChunk[]> {
  // 1. Generate embedding for query
  const queryEmbedding = await generateQueryEmbedding(userQuery);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // 2. Query top-k nearest chunks
  let sql = `
    SELECT 
      dc.id,
      dc.document_id,
      dc.chunk_index,
      dc.content,
      dc.page_number,
      dc.token_count,
      d.filename,
      1 - (dc.embedding <=> $1::vector) AS similarity
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.status = 'ready'
  `;

  const params: any[] = [vectorStr];

  if (documentIds && documentIds.length > 0) {
    sql += ` AND d.id = ANY($2::uuid[])`;
    params.push(documentIds);
  }

  sql += `
    ORDER BY dc.embedding <=> $1::vector ASC
    LIMIT $${params.length + 1}
  `;
  params.push(topK);

  const result = await query(sql, params);

  return result.rows.map((row: any) => ({
    id: row.id,
    documentId: row.document_id,
    filename: row.filename,
    chunkIndex: row.chunk_index,
    content: row.content,
    pageNumber: row.page_number,
    tokenCount: row.token_count,
    similarity: Math.max(0, Math.min(1, parseFloat(row.similarity || 0))),
  }));
}
