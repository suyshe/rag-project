# AI Chatbot with Document RAG

A full-stack AI chatbot that allows users to upload PDF documents and ask questions about them.

The application uses **Retrieval-Augmented Generation (RAG)** to retrieve relevant information from uploaded documents and provide grounded answers using an AI model.

---

## Features

- Upload and process PDF documents
- Extract text from PDF files
- Split documents into searchable chunks
- Generate vector embeddings for document chunks
- Semantic search using PostgreSQL and pgvector
- Ask questions about uploaded documents
- Claude as the primary AI model
- Gemini as a fallback AI model
- Streaming AI responses
- Source citations for generated answers
- PDF page references for citations
- Modern responsive chat interface
- Document management and processing status
- PostgreSQL database with vector search

---

## How It Works

```text
PDF Upload
    ↓
Extract PDF Text
    ↓
Split Text into Chunks
    ↓
Generate Cohere Embeddings
    ↓
Store Chunks + Embeddings
    ↓
PostgreSQL + pgvector
    ↓
User Asks a Question
    ↓
Generate Query Embedding
    ↓
Semantic Vector Search
    ↓
Retrieve Relevant Document Chunks
    ↓
Build Context
    ↓
Claude AI
    ↓
If Claude is unavailable → Gemini
    ↓
Stream Answer
    ↓
Show Answer + PDF Sources

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Markdown
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- tsx

### AI & RAG

- Anthropic Claude - Primary AI model
- Google Gemini - Fallback AI model
- Cohere - Text embeddings
- Retrieval-Augmented Generation (RAG)

### Database

- PostgreSQL
- pgvector
- UUID support

### Document Processing

- PDF text extraction
- Token-based text chunking
- Vector embeddings
- Cosine similarity search

---

## Project Structure

```text
ai-chatbot-document-rag/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts
│   │   │
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── migrate.ts
│   │   │
│   │   ├── middleware/
│   │   │
│   │   ├── routes/
│   │   │   ├── documentRoutes.ts
│   │   │   ├── chatRoutes.ts
│   │   │   └── healthRoutes.ts
│   │   │
│   │   ├── services/
│   │   │   ├── pdfService.ts
│   │   │   ├── ragService.ts
│   │   │   ├── llmService.ts
│   │   │   └── embeddingService.ts
│   │   │
│   │   └── index.ts
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   ├── Documents/
│   │   │   ├── Layout/
│   │   │   └── UI/
│   │   │
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   └── useDocuments.ts
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   └── package.json
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
