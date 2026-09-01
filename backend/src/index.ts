import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { runMigrations } from './db/migrate.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: '*', // Allow all origins for dev/production flexibility
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/documents', documentRoutes);
app.use('/chat', chatRoutes);

// Root greeting endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI Chatbot with Document RAG API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      documents: {
        upload: 'POST /documents/upload',
        list: 'GET /documents',
        get: 'GET /documents/:id',
        delete: 'DELETE /documents/:id',
      },
      chat: {
        stream: 'POST /chat/stream',
      },
    },
  });
});

// Centralized error handler
app.use(errorHandler);

// Server startup
const PORT = env.PORT || 5000;

async function startServer() {
  // Attempt initial database migration
  if (env.DATABASE_URL) {
    try {
      await runMigrations();
      console.log('[Server] Database connection & migrations verified.');
    } catch (err: any) {
      console.warn(
        `[Server] Notice: Database migration encountered an issue (${err.message}). The server will start, but database operations may fail until DATABASE_URL is valid.`
      );
    }
  } else {
    console.warn(
      '[Server] Notice: DATABASE_URL is not set. Please configure .env file to enable vector database queries.'
    );
  }

  app.listen(PORT, () => {
    console.log(`[Server] AI Chatbot RAG backend running at http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch((err) => {
  console.error('[Server Fatal Error]:', err);
});
