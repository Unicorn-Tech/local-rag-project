import { Pool } from "pg";

const embeddingDimensions = 768;

export interface RetrievalResult {
  chunk: string;
  score: number;
}

interface RetrievalRow {
  content: string;
  score: number;
}

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL must be set to use the pgvector store.");
    }

    pool = new Pool({ connectionString });
  }

  return pool;
}

export async function initializeVectorStore(): Promise<void> {
  const database = getPool();

  await database.query("CREATE EXTENSION IF NOT EXISTS vector");
  await database.query(`
    CREATE TABLE IF NOT EXISTS rag_documents (
      id text PRIMARY KEY,
      source_hash text NOT NULL,
      embedding_model text NOT NULL,
      indexed_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id bigserial PRIMARY KEY,
      document_id text NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
      chunk_index integer NOT NULL,
      content text NOT NULL,
      embedding vector(${embeddingDimensions}) NOT NULL,
      UNIQUE (document_id, chunk_index)
    )
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx
    ON rag_chunks USING hnsw (embedding vector_cosine_ops)
  `);
}

export async function isDocumentIndexed(
  documentId: string,
  sourceHash: string,
  model: string,
): Promise<boolean> {
  const result = await getPool().query(
    `SELECT 1 FROM rag_documents
     WHERE id = $1 AND source_hash = $2 AND embedding_model = $3`,
    [documentId, sourceHash, model],
  );

  return result.rowCount === 1;
}

export async function replaceDocumentChunks(
  documentId: string,
  sourceHash: string,
  model: string,
  chunks: string[],
  embeddings: number[][],
): Promise<void> {
  if (chunks.length !== embeddings.length) {
    throw new Error("Each chunk must have exactly one embedding.");
  }

  for (const embedding of embeddings) {
    if (
      embedding.length !== embeddingDimensions ||
      embedding.some((value) => !Number.isFinite(value))
    ) {
      throw new Error(
        `Expected finite embeddings with ${embeddingDimensions} dimensions.`,
      );
    }
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM rag_documents WHERE id = $1", [documentId]);
    await client.query(
      `INSERT INTO rag_documents (id, source_hash, embedding_model)
       VALUES ($1, $2, $3)`,
      [documentId, sourceHash, model],
    );

    for (let index = 0; index < chunks.length; index += 1) {
      await client.query(
        `INSERT INTO rag_chunks (document_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [documentId, index, chunks[index], JSON.stringify(embeddings[index])],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  topK = 3,
): Promise<RetrievalResult[]> {
  if (
    queryEmbedding.length !== embeddingDimensions ||
    queryEmbedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      `Expected a finite query embedding with ${embeddingDimensions} dimensions.`,
    );
  }
  if (!Number.isInteger(topK) || topK < 1) {
    throw new Error("topK must be a positive integer.");
  }

  const result = await getPool().query<RetrievalRow>(
    `SELECT content, 1 - (embedding <=> $1::vector) AS score
     FROM rag_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), topK],
  );

  return result.rows.map((row) => ({ chunk: row.content, score: row.score }));
}

export async function closeVectorStore(): Promise<void> {
  if (pool) {
    const currentPool = pool;
    pool = undefined;
    await currentPool.end();
  }
}