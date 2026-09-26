"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const documentLoader_1 = require("./rag/documentLoader");
const chunker_1 = require("./rag/chunker");
const embeddings_1 = require("./rag/embeddings");
const retriever_1 = require("./rag/retriever");
const generator_1 = require("./rag/generator");
async function main() {
    const question = process.env.QUESTION || "What types of documents are accepted as proof of purchase?";
    const documentPath = process.env.DOCUMENT_PATH || "src/data/insurance.txt";
    const document = await (0, documentLoader_1.loadInsuranceDocument)(documentPath);
    const chunks = (0, chunker_1.chunkText)(document, 120, 30);
    const embeddings = (0, embeddings_1.buildEmbeddings)(chunks);
    const relevant = (0, retriever_1.retrieveRelevantChunks)(question, chunks, embeddings, 2);
    const context = relevant.map((entry) => entry.chunk).join("\n\n");
    const answer = await (0, generator_1.generateAnswer)(question, context || document);
    console.log("Question:", question);
    console.log("\nRelevant context:");
    console.log(context || document);
    console.log("\nAnswer:");
    console.log(answer);
}
main().catch((error) => {
    console.error("RAG pipeline failed:", error);
    process.exitCode = 1;
});
