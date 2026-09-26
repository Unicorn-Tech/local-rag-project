# Local RAG Project

This project chunks a local document, indexes its Ollama embeddings in PostgreSQL with pgvector, and retrieves the closest chunks to answer a question.

## Requirements

- Node.js and npm
- Docker Compose
- Ollama

## Run

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with pgvector (published on host port `5433` to avoid conflicts with a local PostgreSQL server):

	```sh
	docker compose up -d
	```

3. Download the embedding and chat models:

	```sh
	ollama pull nomic-embed-text
	ollama pull llama3.2
	```

4. Install dependencies and run the pipeline:

	```sh
	npm install
	npm run dev
	```

The first run creates the pgvector tables and indexes the document. Later runs reuse stored embeddings unless the document contents or embedding model change. `DATABASE_URL`, `EMBEDDING_MODEL`, `CHAT_MODEL`, `QUESTION`, and `DOCUMENT_PATH` can be configured in `.env`. Keep the database URL's port at `5433` to connect to the Compose container.

The schema currently expects 768-dimensional vectors from `nomic-embed-text`. If you select an embedding model with a different output dimension, update the `vector(768)` definition and the dimension validation in `src/rag/vectorStore.ts`, then recreate/reindex the table.

The existing unit tests for chunking and the original lexical retriever do not require PostgreSQL. The application itself requires a running PostgreSQL/pgvector service and Ollama.


## Project Description

This project is a local, educational retrieval-augmented generation (RAG) application for asking questions about an insurance policy. It reads `src/data/insurance.txt`, splits the policy into overlapping chunks, and generates semantic embeddings with Ollama's `nomic-embed-text` model. The chunks and vectors are stored in PostgreSQL using pgvector.

For each question, the app embeds the query, retrieves the most relevant policy chunks using cosine similarity, and passes that context to Ollama's `llama3.2` model to generate a grounded answer. Unchanged source documents are not re-embedded on every run. The project demonstrates a basic local RAG workflow; it is intended for learning and is not a production insurance decision system.