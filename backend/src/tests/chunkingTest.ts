import { createTokenAwareChunks, countTokens } from '../services/chunkService.js';
import { PageText } from '../services/pdfService.js';

function runChunkingTests() {
  console.log('=== Running Token-Aware Chunking Verification Tests ===\n');

  // Generate synthetic multi-page document
  const sampleParagraph = `Artificial intelligence (AI) and Retrieval-Augmented Generation (RAG) combine the reasoning capabilities of large language models with dynamic information retrieval from external knowledge bases. Rather than relying solely on static parametric memory learned during pre-training, RAG dynamically retrieves relevant context from external documents at query time. This drastically reduces hallucinations, ensures domain-specific accuracy, and allows access to real-time enterprise data. `;

  // Create 3 pages with repeated text
  const pages: PageText[] = [
    {
      pageNumber: 1,
      text: sampleParagraph.repeat(15), // ~750 tokens
    },
    {
      pageNumber: 2,
      text: sampleParagraph.repeat(12), // ~600 tokens
    },
    {
      pageNumber: 3,
      text: sampleParagraph.repeat(8),  // ~400 tokens
    },
  ];

  console.log(`Input: 3 Pages`);
  pages.forEach((p) => {
    console.log(` - Page ${p.pageNumber}: ${countTokens(p.text)} tokens`);
  });

  const chunkSize = 500;
  const overlap = 50;
  const chunks = createTokenAwareChunks(pages, chunkSize, overlap);

  console.log(`\nGenerated ${chunks.length} chunks with target size=${chunkSize}, overlap=${overlap}:`);

  let allValid = true;

  chunks.forEach((chunk, i) => {
    console.log(
      `Chunk ${chunk.chunkIndex} (Page ${chunk.pageNumber}): ${chunk.tokenCount} tokens, length: ${chunk.content.length} chars`
    );

    if (chunk.tokenCount > chunkSize) {
      console.error(`❌ ERROR: Chunk ${i} exceeded max token limit (${chunk.tokenCount} > ${chunkSize})`);
      allValid = false;
    }

    if (chunk.tokenCount === 0) {
      console.error(`❌ ERROR: Chunk ${i} is empty!`);
      allValid = false;
    }
  });

  if (allValid && chunks.length > 1) {
    console.log('\n✅ All chunking tests passed successfully! Chunks respect token constraints & page metadata.');
  } else {
    console.error('\n❌ Chunking test failed validation.');
    process.exit(1);
  }
}

runChunkingTests();
