import { getDbPool, query } from './index.js';

export async function runMigrations(): Promise<void> {
  console.log('[Migration] Starting database migration...');
  
  try {
    // 1. Enable pgvector and uuid extensions
    console.log('[Migration] Ensuring vector & uuid extensions are installed...');
    await query('CREATE EXTENSION IF NOT EXISTS vector;');
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // 2. Create documents table
    console.log('[Migration] Ensuring documents table exists...');
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        total_pages INTEGER DEFAULT 0,
        total_chunks INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Create document_chunks table
    console.log('[Migration] Ensuring document_chunks table exists...');
    await query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        token_count INTEGER NOT NULL,
        embedding vector(1536),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Create indexes
    console.log('[Migration] Ensuring indices exist...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id 
      ON document_chunks (document_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_document_chunks_page_number 
      ON document_chunks (page_number);
    `);

    // Try HNSW index for fast cosine similarity vector search
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw 
        ON document_chunks USING hnsw (embedding vector_cosine_ops);
      `);
      console.log('[Migration] HNSW vector index ensured.');
    } catch (hnswErr: any) {
      console.warn('[Migration] Note on HNSW index (falling back to standard indexing if unsupported):', hnswErr.message);
    }

    console.log('[Migration] Database migration completed successfully!');
  } catch (error: any) {
    console.error('[Migration Error]:', error.message);
    throw error;
  }
}

// Standalone execution support
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(async () => {
      console.log('[Migration] Done. Exiting.');
      const pool = getDbPool();
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Migration] Failed:', err);
      try {
        const pool = getDbPool();
        await pool.end();
      } catch {}
      process.exit(1);
    });
}