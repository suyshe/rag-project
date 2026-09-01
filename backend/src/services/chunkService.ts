import { getEncoding, Tiktoken } from 'js-tiktoken';
import { PageText } from './pdfService.js';

export interface DocumentChunk {
  chunkIndex: number;
  content: string;
  pageNumber: number;
  tokenCount: number;
}

let tokenizerInstance: Tiktoken | null = null;

function getTokenizer(): Tiktoken {
  if (!tokenizerInstance) {
    tokenizerInstance = getEncoding('cl100k_base');
  }
  return tokenizerInstance;
}

export function countTokens(text: string): number {
  const enc = getTokenizer();
  return enc.encode(text).length;
}

/**
 * Creates token-aware chunks (500 tokens each with 50 tokens overlap)
 * from page-annotated text segments.
 */
export function createTokenAwareChunks(
  pages: PageText[],
  chunkSize = 500,
  overlap = 50
): DocumentChunk[] {
  const enc = getTokenizer();
  const taggedTokens: Array<{ token: number; pageNumber: number }> = [];

  for (const page of pages) {
    if (!page.text || page.text.trim().length === 0) continue;

    const tokens = enc.encode(page.text);
    for (const token of tokens) {
      taggedTokens.push({
        token,
        pageNumber: page.pageNumber,
      });
    }
  }

  if (taggedTokens.length === 0) {
    return [];
  }

  const step = Math.max(1, chunkSize - overlap);
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (let start = 0; start < taggedTokens.length; start += step) {
    const end = Math.min(start + chunkSize, taggedTokens.length);
    const window = taggedTokens.slice(start, end);

    const tokenIds = window.map((w) => w.token);
    const decodedText = enc.decode(tokenIds).trim();

    if (decodedText.length === 0) {
      continue;
    }

    // Determine the primary page for this chunk (starting page number)
    const pageNumber = window[0]?.pageNumber || 1;

    chunks.push({
      chunkIndex,
      content: decodedText,
      pageNumber,
      tokenCount: tokenIds.length,
    });

    chunkIndex++;

    // If this window reached the end of all tokens, stop
    if (end === taggedTokens.length) {
      break;
    }
  }

  return chunks;
}
