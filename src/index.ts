import { loadInsuranceDocument } from "./rag/documentLoader";
import { chunkText } from "./rag/chunker";
import { buildEmbeddings } from "./rag/embeddings";
import { retrieveRelevantChunks } from "./rag/retriever";
import { generateAnswer } from "./rag/generator";

async function main(): Promise<void> {
  const question = process.env.QUESTION || "What types of documents are accepted as proof of purchase?";
  const documentPath = process.env.DOCUMENT_PATH || "src/data/insurance.txt";

  const document = await loadInsuranceDocument(documentPath);
  const chunks = chunkText(document, 120, 30);
  const embeddings = buildEmbeddings(chunks);

  const relevant = retrieveRelevantChunks(question, chunks, embeddings, 2);
  const context = relevant.map((entry) => entry.chunk).join("\n\n");

  const answer = await generateAnswer(question, context || document);

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
