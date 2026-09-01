import { Router, Request, Response } from 'express';
import { uploadPdfMiddleware } from '../middleware/upload.js';
import { query } from '../db/index.js';
import { processAndStorePdf, DocumentRecord } from '../services/ragService.js';

const router = Router();

// POST /documents/upload - Upload and process PDF
router.post('/upload', uploadPdfMiddleware.single('file'), async (req: Request, res: Response, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No PDF file was provided in the request.' });
      return;
    }

    const { originalname, size, buffer } = req.file;

    // Insert initial document record in 'processing' status
    const insertResult = await query<DocumentRecord>(
      `
      INSERT INTO documents (filename, file_size, status)
      VALUES ($1, $2, 'processing')
      RETURNING *
      `,
      [originalname, size]
    );

    const document = insertResult.rows[0];

    // Process ingestion (parse -> chunk -> embed -> store)
    // Synchronously process or background process; since documents are typically 1-50 pages in a lightweight app,
    // we process immediately so the client can receive full chunk statistics or status immediately.
    try {
      await processAndStorePdf(document.id, buffer);
      
      const updatedDoc = await query<DocumentRecord>(
        'SELECT * FROM documents WHERE id = $1',
        [document.id]
      );

      res.status(201).json({
        success: true,
        document: updatedDoc.rows[0],
        message: 'Document uploaded and indexed successfully.',
      });
    } catch (processErr: any) {
      res.status(500).json({
        success: false,
        document: {
          ...document,
          status: 'failed',
          error_message: processErr.message || 'Processing failed',
        },
        error: processErr.message || 'Failed to process and index document.',
      });
    }
  } catch (error: any) {
    next(error);
  }
});

// GET /documents - List all documents
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const result = await query<DocumentRecord>(
      `
      SELECT 
        id,
        filename,
        file_size,
        total_pages,
        total_chunks,
        status,
        error_message,
        created_at,
        updated_at
      FROM documents
      ORDER BY created_at DESC
      `
    );

    res.json({
      success: true,
      documents: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /documents/:id - Get specific document details
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const docResult = await query<DocumentRecord>(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    if (docResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Document not found.' });
      return;
    }

    const chunksResult = await query(
      `
      SELECT id, chunk_index, page_number, token_count, SUBSTRING(content FROM 1 FOR 150) as snippet_preview
      FROM document_chunks
      WHERE document_id = $1
      ORDER BY chunk_index ASC
      LIMIT 20
      `,
      [id]
    );

    res.json({
      success: true,
      document: docResult.rows[0],
      chunksPreview: chunksResult.rows,
    });
  } catch (error: any) {
    next(error);
  }
});

// DELETE /documents/:id - Delete document and cascading chunks
router.get('/delete/:id', async (req: Request, res: Response, next) => {
  // Support both GET /delete/:id and DELETE /:id for convenience
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM documents WHERE id = $1 RETURNING id, filename', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Document not found.' });
      return;
    }

    res.json({
      success: true,
      message: `Document ${result.rows[0].filename} deleted successfully.`,
    });
  } catch (error: any) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM documents WHERE id = $1 RETURNING id, filename', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Document not found.' });
      return;
    }

    res.json({
      success: true,
      message: `Document ${result.rows[0].filename} deleted successfully.`,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
