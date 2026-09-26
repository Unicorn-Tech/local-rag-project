"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const documentLoader_1 = require("../src/rag/documentLoader");
const chunker_1 = require("../src/rag/chunker");
const embeddings_1 = require("../src/rag/embeddings");
const retriever_1 = require("../src/rag/retriever");
(0, node_test_1.default)("loadInsuranceDocument reads the policy file", async () => {
    const document = await (0, documentLoader_1.loadInsuranceDocument)("src/data/insurance.txt");
    strict_1.default.match(document, /Insurance Claim Policy/i);
    strict_1.default.match(document, /30 days/i);
});
(0, node_test_1.default)("chunkText splits the policy into meaningful sections", async () => {
    const document = await (0, documentLoader_1.loadInsuranceDocument)("src/data/insurance.txt");
    const chunks = (0, chunker_1.chunkText)(document, 80, 20);
    strict_1.default.ok(chunks.length >= 2, "expected at least 2 chunks");
    strict_1.default.ok(chunks.some((chunk) => chunk.toLowerCase().includes("30 days")), "expected a chunk containing the claim deadline");
});
(0, node_test_1.default)("retrieveRelevantChunks returns the most relevant policy text", async () => {
    const document = await (0, documentLoader_1.loadInsuranceDocument)("src/data/insurance.txt");
    const chunks = (0, chunker_1.chunkText)(document, 80, 20);
    const embeddings = (0, embeddings_1.buildEmbeddings)(chunks);
    const results = (0, retriever_1.retrieveRelevantChunks)("When can I submit an accidental damage claim?", chunks, embeddings, 2);
    strict_1.default.ok(results.some((item) => item.chunk.toLowerCase().includes("30 days")), "expected a retrieved chunk related to the 30-day claim window");
});
