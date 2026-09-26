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
