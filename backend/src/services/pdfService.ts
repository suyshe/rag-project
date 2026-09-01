import pdfParse from 'pdf-parse';

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
 * Extracts clean text and per-page mappings from a PDF buffer using pdf-parse.
 */
export async function extractPdfText(buffer: Buffer): Promise<ParsedPdfResult> {
  const pages: PageText[] = [];
  let pageCounter = 0;

  const customPagerender = (pageData: any) => {
    return pageData.getTextContent({
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    }).then((textContent: any) => {
      pageCounter++;
      let lastY: number | null = null;
      let pageText = '';

      for (const item of textContent.items) {
        if (lastY === item.transform[5] || lastY === null) {
          pageText += (item.str || '') + ' ';
        } else {
          pageText += '\n' + (item.str || '') + ' ';
        }
        lastY = item.transform[5];
      }

      const cleanedText = pageText
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      pages.push({
        pageNumber: pageCounter,
        text: cleanedText,
      });

      return pageText;
    });
  };

  try {
    const data = await pdfParse(buffer, {
      pagerender: customPagerender,
    });

    // If pages array wasn't populated properly by the custom renderer, fallback to full text
    if (pages.length === 0) {
      const full = (data.text || '').trim();
      pages.push({
        pageNumber: 1,
        text: full,
      });
    }

    return {
      totalPages: data.numpages || pages.length || 1,
      fullText: data.text || '',
      pages: pages.sort((a, b) => a.pageNumber - b.pageNumber),
    };
  } catch (error: any) {
    throw new Error(`Failed to parse PDF: ${error.message || error}`);
  }
}
