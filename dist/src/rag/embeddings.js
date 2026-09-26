"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeText = tokenizeText;
exports.buildEmbeddings = buildEmbeddings;
exports.cosineSimilarity = cosineSimilarity;
function tokenizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}
function buildEmbeddings(chunks) {
    const vocabulary = Array.from(new Set(chunks.flatMap((chunk) => tokenizeText(chunk)))).sort();
    return chunks.map((chunk) => {
        const counts = new Map();
        for (const token of tokenizeText(chunk)) {
            counts.set(token, (counts.get(token) ?? 0) + 1);
        }
        const values = vocabulary.map((token) => counts.get(token) ?? 0);
        return { values };
    });
}
function cosineSimilarity(a, b) {
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
