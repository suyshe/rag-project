import { PDFParse } from 'pdf-parse';

export interface PageText {
  pageNumber: number;
  text: string;
}

export interface ParsedPdfResult {
  totalPages: number;
  fullText: string;
  pages: PageText[];
}

/**
 * Extracts text and page-level mappings from a PDF buffer.
 *
 * Uses the current pdf-parse API.
 */
export async function extractPdfText(
  buffer: Buffer
): Promise<ParsedPdfResult> {
  try {
    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    const fullText = (result.text || '').trim();

    /**
     * pdf-parse returns page-separated text.
     * We split it into individual pages while preserving
     * page numbers for RAG citations.
     */
    const rawPages = fullText
      .split(/\f/)
      .map((text) => text.trim());

    const pages: PageText[] = rawPages
      .map((text, index) => ({
        pageNumber: index + 1,
        text,
      }))
      .filter((page) => page.text.length > 0);

    /**
     * Some PDFs may not contain form-feed page separators.
     * In that case, keep the complete text as page 1.
     */
    if (pages.length === 0 && fullText) {
      pages.push({
        pageNumber: 1,
        text: fullText,
      });
    }

    return {
      totalPages: result.total || pages.length || 1,
      fullText,
      pages,
    };
  } catch (error: any) {
    throw new Error(
      `Failed to parse PDF: ${error?.message || error}`
    );
  }
}
