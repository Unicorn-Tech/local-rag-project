import "dotenv/config";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { loadInsuranceDocument } from "./rag/documentLoader";
import { chunkText } from "./rag/chunker";
import { embedTexts, embeddingModel } from "./rag/embeddings";
import {
  closeVectorStore,
  initializeVectorStore,
  isDocumentIndexed,
  replaceDocumentChunks,
  retrieveRelevantChunks,
} from "./rag/vectorStore";
import { generateAnswer } from "./rag/generator";

async function main(): Promise<void> {
  const question = process.env.QUESTION || "What types of documents are accepted as proof of purchase?";
  const documentPath = process.env.DOCUMENT_PATH || "src/data/insurance.txt";

  try {
    const document = await loadInsuranceDocument(documentPath);
    const documentId = resolve(documentPath);
    const sourceHash = createHash("sha256")
      .update(JSON.stringify({ document, chunkSize: 120, overlap: 30 }))
      .digest("hex");
    const chunks = chunkText(document, 120, 30);

    if (chunks.length === 0) {
      throw new Error("The document contains no text to index.");
    }

    await initializeVectorStore();
    if (!(await isDocumentIndexed(documentId, sourceHash, embeddingModel))) {
      const embeddings = await embedTexts(chunks);
      await replaceDocumentChunks(
        documentId,
        sourceHash,
        embeddingModel,
        chunks,
        embeddings,
      );
    }

    const [queryEmbedding] = await embedTexts([question]);
    if (!queryEmbedding) {
      throw new Error("Ollama did not return an embedding for the question.");
    }

    const relevant = await retrieveRelevantChunks(queryEmbedding, 2);
    const context = relevant.map((entry) => entry.chunk).join("\n\n");
    const answer = await generateAnswer(question, context || document);

    console.log("Question:", question);
    console.log("\nRelevant context:");
    console.log(context || document);
    console.log("\nAnswer:");
    console.log(answer);
  } finally {
    await closeVectorStore();
  }
}

main().catch((error) => {
  console.error("RAG pipeline failed:", error);
  process.exitCode = 1;
});
