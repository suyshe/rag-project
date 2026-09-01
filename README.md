# AI Chatbot with Document RAG

A complete, lightweight, production-ready full-stack AI Chatbot application with Retrieval-Augmented Generation (RAG). Built to run efficiently on free-tier services.

---

## Architecture & Flow

```
+-----------------------------------------------------------------------------------+
|                                  RAG Pipeline Flow                                |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [PDF Upload]                                                                     |
|       |                                                                           |
|       v                                                                           |
|  [Text & Page Extraction] (pdf-parse)                                             |
|       |                                                                           |
|       v                                                                           |
|  [Token-Aware Chunking] (500 tokens with 50 token overlap via js-tiktoken)        |
|       |                                                                           |
|       v                                                                           |
|  [OpenAI Embeddings] (text-embedding-3-small, 1536 dimensions)                    |
|       |                                                                           |
|       v                                                                           |
|  [PostgreSQL + pgvector] (document_chunks table with HNSW index)                  |
|       |                                                                           |
|       v                                                                           |
|  [Cosine Similarity Search] (1 - (embedding <=> query_vec) -> Top 5 Chunks)       |
|       |                                                                           |
|       v                                                                           |
|  [Grounded Context + Prompt]                                                      |
|       |                                                                           |
|       v                                                                           |
|  [Claude LLM] (@anthropic-ai/sdk)                                                 |
|       |                                                                           |
|       v                                                                           |
|  [SSE Streaming Response] (Real-time deltas + [1], [2] source citations)          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite | Responsive ChatGPT/Claude UI, Markdown rendering, interactive citation modals |
| **Backend** | Node.js, Express, TypeScript | REST APIs + Server-Sent Events (SSE) streaming |
| **Database** | PostgreSQL + pgvector extension | Vector storage with HNSW index & cosine similarity search |
| **PDF Extraction**| `pdf-parse` | Page-aware text extraction and cleaning |
| **Chunking** | `js-tiktoken` (cl100k_base) | Exact 500-token chunks with 50-token overlap across pages |
| **Embeddings** | OpenAI `text-embedding-3-small` | 1536-dimensional dense vector embeddings |
| **LLM Reasoning**| Claude 3.5 Sonnet (`@anthropic-ai/sdk`) | Strict context grounding & bracket citations `[1]`, `[2]` |
| **Streaming** | Server-Sent Events (SSE) | Real-time token streaming with separate citations metadata event |

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **PostgreSQL Database with pgvector**:
  - *Recommended Free Tier*: Create a free database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) (both include pgvector by default).
- **OpenAI API Key**: For `text-embedding-3-small` embeddings.
- **Anthropic API Key**: For Claude responses.

### 2. Clone & Install Dependencies

From the project root:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

Or individually:
```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the root (or `backend/.env`):

```bash
cp .env.example .env
```

Configure your credentials:

```env
# PostgreSQL connection string with pgvector
DATABASE_URL="postgresql://username:password@ep-cool-project-12345.us-east-2.aws.neon.tech/neondb?sslmode=require"

# OpenAI API Key (used for text-embedding-3-small embeddings)
OPENAI_API_KEY="sk-..."
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"

# Anthropic API Key (used for Claude streaming responses)
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# Server Configuration
PORT=5000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### 4. Run Database Migration

Run the migration script to initialize the tables (`documents`, `document_chunks`) and enable the `vector` extension:

```bash
npm run db:migrate
```

### 5. Run the Application

Start both Backend and Frontend concurrently with one command:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## Backend API Specification

### 1. `GET /health`
Returns system status, database connection state, and vector extension availability.
```json
{
  "status": "ok",
  "timestamp": "2026-08-29T07:00:00.000Z",
  "database": {
    "ok": true,
    "message": "Connected to neondb",
    "vectorExtension": true
  },
  "config": {
    "openaiConfigured": true,
    "anthropicConfigured": true,
    "openaiEmbeddingModel": "text-embedding-3-small",
    "anthropicModel": "claude-3-5-sonnet-20241022",
    "environment": "development"
  }
}
```

### 2. `POST /documents/upload`
Multipart form upload with field `file` containing a `.pdf`.
- Extracts text page-by-page.
- Chunks into 500 tokens with 50 token overlap.
- Generates 1536-dim OpenAI embeddings.
- Saves document & chunk rows in Postgres with pgvector.
- Updates document status to `ready`.

### 3. `GET /documents`
Lists all documents with page counts, chunk counts, statuses (`ready`, `processing`, `failed`), and timestamps.

### 4. `GET /documents/:id`
Retrieves metadata and sample chunk excerpts for a specific document.

### 5. `DELETE /documents/:id`
Deletes a document and cascades deletion of all its vector chunks.

### 6. `POST /chat/stream` (SSE)
Streams Claude's grounded answer.
**Request Body**:
```json
{
  "message": "What are the key findings regarding transformer scaling?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help you today?" }
  ],
  "documentIds": ["<optional-uuid-to-scope-search>"]
}
```

**SSE Events**:
- `type: "citations"`: Array of top 5 retrieved chunks with `filename`, `pageNumber`, `similarity`, and `snippet`.
- `type: "delta"`: Real-time text token stream from Claude.
- `type: "done"`: Completed streaming event with `fullAnswer`.
- `type: "error"`: Error message if retrieval or generation fails.

---

## Verification & Testing

### 1. Run Chunking Test
Verify that 500-token chunking and 50-token overlap logic accurately processes multi-page text:
```bash
npm run test:chunking
```

### 2. Typecheck & Build
```bash
npm run build
```

---

## Free-Tier Database Setup Details (Neon / Supabase)

1. Go to [Neon.tech](https://neon.tech) and create a free PostgreSQL database.
2. Under "Connection Details", copy the connection string (`postgresql://...`).
3. Paste into `.env` as `DATABASE_URL`.
4. Run `npm run db:migrate`. The pgvector extension and tables are automatically configured.
