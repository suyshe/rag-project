# AI Chatbot with Document RAG

A full-stack AI chatbot that allows users to upload PDF documents and ask questions about them.

The application uses **Retrieval-Augmented Generation (RAG)** to find relevant information from uploaded documents and provide it to an AI model to generate grounded answers.

The project uses **Claude as the primary AI model** and **Ollama as a local fallback** when Claude is unavailable.

---

## Features

-  Upload and process PDF documents
-  Semantic search across uploaded documents
-  Chat with your documents
-  Claude AI for generating responses
-  Ollama as a local fallback AI model
-  Source citations for answers
-  Streaming AI responses
-  PostgreSQL with pgvector for vector search
-  Responsive and modern chat interface

---

## How It Works

```text
PDF Upload
    ↓
Extract Text
    ↓
Split Text into Chunks
    ↓
Generate Embeddings
    ↓
Store in PostgreSQL + pgvector
    ↓
User Asks a Question
    ↓
Find Relevant Document Chunks
    ↓
Build Context
    ↓
Claude AI
    ↓
If Claude is unavailable → Ollama
    ↓
Generate Answer
    ↓
Show Answer + Sources
```

The chatbot first searches the uploaded documents for relevant information before generating an answer.

This allows the AI to answer questions based on the content of the user's documents instead of relying only on its general knowledge.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Vite

### Backend

- Node.js
- Express
- TypeScript

### AI & RAG

- Claude (Anthropic) - Primary AI model
- Ollama - Local fallback AI model
- OpenAI Embeddings - Document embeddings

### Database

- PostgreSQL
- pgvector

### Document Processing

- PDF text extraction
- Token-based text chunking
- Vector similarity search

---

## Project Structure

```text
ai-chatbot-document-rag/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.tsx
│   │
│   └── package.json
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js 18+
- PostgreSQL with pgvector
- OpenAI API key
- Anthropic API key
- Ollama (optional)

You can use services such as **Neon** or **Supabase** for PostgreSQL.

---
## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/suyshe/rag-project.git
cd rag-project
```

Install the dependencies for the root project:

```bash

npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

After installation, return to the project root:

```bash
cd ..
```


## Environment Variables

Create a `.env` file using `.env.example`.

Example:

```env
DATABASE_URL="your-postgresql-connection-string"

OPENAI_API_KEY="your-openai-api-key"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"

ANTHROPIC_API_KEY="your-anthropic-api-key"
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_CHAT_MODEL="llama3.2:3b"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"

PORT=5000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

---

## Database Setup

After configuring your PostgreSQL database, run:

```bash
npm run db:migrate
```

This will create the required tables and enable the `pgvector` extension.

---

## Run the Application

Start both the frontend and backend:

```bash
npm run dev
```

The application will be available at:

```text
Frontend: http://localhost:5173
Backend: http://localhost:5000
```

---

## Ollama Fallback

Ollama is optional and can be used as a local fallback AI model.

Install Ollama and pull the model:

```bash
ollama pull llama3.2:3b
```

Make sure Ollama is running locally.

If Claude is unavailable, the application can use Ollama to generate the response locally.

---

## Testing

Run the chunking test:

```bash
npm run test:chunking
```

Build the project:

```bash
npm run build
```

---

## Project Overview

This project demonstrates how **RAG, vector search, document processing, and Large Language Models** can be combined to build an AI chatbot that can interact with private documents.

The main goal was to build a simple and practical document-based AI assistant with:

- Document understanding
- Semantic search
- Context-aware responses
- Source citations
- AI model fallback

---

## 🔮 Future Improvements

- User authentication
- Support for more document formats
- Multiple document collections
- Conversation history
- Background document processing
- More AI model options
- Improved document retrieval
- Cloud deployment