"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const documentLoader_1 = require("./rag/documentLoader");
const chunker_1 = require("./rag/chunker");
const embeddings_1 = require("./rag/embeddings");
const vectorStore_1 = require("./rag/vectorStore");
const generator_1 = require("./rag/generator");
async function main() {
    const question = process.env.QUESTION || "What types of documents are accepted as proof of purchase?";
    const documentPath = process.env.DOCUMENT_PATH || "src/data/insurance.txt";
    try {
        const document = await (0, documentLoader_1.loadInsuranceDocument)(documentPath);
        const documentId = (0, node_path_1.resolve)(documentPath);
        const sourceHash = (0, node_crypto_1.createHash)("sha256")
            .update(JSON.stringify({ document, chunkSize: 120, overlap: 30 }))
            .digest("hex");
        const chunks = (0, chunker_1.chunkText)(document, 120, 30);
        if (chunks.length === 0) {
            throw new Error("The document contains no text to index.");
        }
        await (0, vectorStore_1.initializeVectorStore)();
        if (!(await (0, vectorStore_1.isDocumentIndexed)(documentId, sourceHash, embeddings_1.embeddingModel))) {
            const embeddings = await (0, embeddings_1.embedTexts)(chunks);
            await (0, vectorStore_1.replaceDocumentChunks)(documentId, sourceHash, embeddings_1.embeddingModel, chunks, embeddings);
        }
        const [queryEmbedding] = await (0, embeddings_1.embedTexts)([question]);
        if (!queryEmbedding) {
            throw new Error("Ollama did not return an embedding for the question.");
        }
        const relevant = await (0, vectorStore_1.retrieveRelevantChunks)(queryEmbedding, 2);
        const context = relevant.map((entry) => entry.chunk).join("\n\n");
        const answer = await (0, generator_1.generateAnswer)(question, context || document);
        console.log("Question:", question);
        console.log("\nRelevant context:");
        console.log(context || document);
        console.log("\nAnswer:");
        console.log(answer);
    }
    finally {
        await (0, vectorStore_1.closeVectorStore)();
    }
}
main().catch((error) => {
    console.error("RAG pipeline failed:", error);
    process.exitCode = 1;
});
