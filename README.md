# AI Chatbot with Document RAG

A full-stack AI chatbot that allows users to upload PDF documents and ask questions about them.

The application uses **Retrieval-Augmented Generation (RAG)** to retrieve relevant information from uploaded documents and provide it as context to an AI model for grounded responses.

---

## Features

- PDF document upload
- PDF text extraction and processing
- Automatic text chunking
- Semantic search using vector embeddings
- PostgreSQL with pgvector for vector storage and similarity search
- AI-powered document question answering
- Claude as the primary AI model
- Gemini as the fallback AI model
- Streaming AI responses
- Source citations with PDF filenames and page numbers
- Multiple document support
- Modern responsive chat interface

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
Store in PostgreSQL + pgvector
    ↓
User Asks a Question
    ↓
Semantic Similarity Search
    ↓
Retrieve Relevant Chunks
    ↓
Build Context
    ↓
Claude AI
    ↓
If Claude is unavailable → Gemini
    ↓
Generate Answer
    ↓
Stream Answer + Sources
