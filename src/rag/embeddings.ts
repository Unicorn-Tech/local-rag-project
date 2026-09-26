import ollama from "ollama";

export const embeddingModel = process.env.EMBEDDING_MODEL || "nomic-embed-text";

export interface EmbeddingVector {
  values: number[];
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const response = await ollama.embed({
    model: embeddingModel,
    input: texts,
  });

  if (response.embeddings.length !== texts.length) {
    throw new Error("Ollama returned an unexpected number of embeddings.");
  }

  return response.embeddings;
}

export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function buildEmbeddings(chunks: string[]): EmbeddingVector[] {
  const vocabulary = Array.from(
    new Set(chunks.flatMap((chunk) => tokenizeText(chunk))),
  ).sort();

  return chunks.map((chunk) => {
    const counts = new Map<string, number>();

    for (const token of tokenizeText(chunk)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    const values = vocabulary.map((token) => counts.get(token) ?? 0);
    return { values };
  });
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dotProduct += a[index] * b[index];
    magnitudeA += a[index] * a[index];
    magnitudeB += b[index] * b[index];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}
