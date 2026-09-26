"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveRelevantChunks = retrieveRelevantChunks;
const embeddings_1 = require("./embeddings");
function retrieveRelevantChunks(query, chunks, embeddings, topK = 3) {
    const vocabulary = Array.from(new Set(chunks.flatMap((chunk) => (0, embeddings_1.tokenizeText)(chunk)))).sort();
    const queryCounts = new Map();
    for (const token of (0, embeddings_1.tokenizeText)(query)) {
        queryCounts.set(token, (queryCounts.get(token) ?? 0) + 1);
    }
    const queryVector = vocabulary.map((token) => queryCounts.get(token) ?? 0);
    const ranked = chunks
        .map((chunk, index) => ({
        chunk,
        score: (0, embeddings_1.cosineSimilarity)(queryVector, embeddings[index]?.values ?? []),
    }))
        .sort((left, right) => right.score - left.score);
    return ranked.slice(0, topK);
}
