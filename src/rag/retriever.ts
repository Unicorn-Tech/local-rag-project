import {
  cosineSimilarity,
  tokenizeText,
  type EmbeddingVector,
} from "./embeddings";

export interface RetrievalResult {
  chunk: string;
  score: number;
}

export function retrieveRelevantChunks(
  query: string,
  chunks: string[],
  embeddings: EmbeddingVector[],
  topK = 3,
): RetrievalResult[] {
  const vocabulary = Array.from(
    new Set(chunks.flatMap((chunk) => tokenizeText(chunk))),
  ).sort();

  const queryCounts = new Map<string, number>();
  for (const token of tokenizeText(query)) {
    queryCounts.set(token, (queryCounts.get(token) ?? 0) + 1);
  }

  const queryVector = vocabulary.map((token) => queryCounts.get(token) ?? 0);

  const ranked = chunks
    .map((chunk, index) => ({
      chunk,
      score: cosineSimilarity(queryVector, embeddings[index]?.values ?? []),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked.slice(0, topK);
}
