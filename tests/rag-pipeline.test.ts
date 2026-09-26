import test from "node:test";
import assert from "node:assert/strict";

import { loadInsuranceDocument } from "../src/rag/documentLoader";
import { chunkText } from "../src/rag/chunker";
import { buildEmbeddings } from "../src/rag/embeddings";
import { retrieveRelevantChunks } from "../src/rag/retriever";

test("loadInsuranceDocument reads the policy file", async () => {
  const document = await loadInsuranceDocument("src/data/insurance.txt");

  assert.match(document, /Insurance Claim Policy/i);
  assert.match(document, /30 days/i);
});

test("chunkText splits the policy into meaningful sections", async () => {
  const document = await loadInsuranceDocument("src/data/insurance.txt");
  const chunks = chunkText(document, 80, 20);

  assert.ok(chunks.length >= 2, "expected at least 2 chunks");
  assert.ok(
    chunks.some((chunk) => chunk.toLowerCase().includes("30 days")),
    "expected a chunk containing the claim deadline",
  );
});

test("retrieveRelevantChunks returns the most relevant policy text", async () => {
  const document = await loadInsuranceDocument("src/data/insurance.txt");
  const chunks = chunkText(document, 80, 20);
  const embeddings = buildEmbeddings(chunks);

  const results = retrieveRelevantChunks(
    "When can I submit an accidental damage claim?",
    chunks,
    embeddings,
    2,
  );

  assert.ok(
    results.some((item) => item.chunk.toLowerCase().includes("30 days")),
    "expected a retrieved chunk related to the 30-day claim window",
  );
});
