import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function loadInsuranceDocument(filePath: string): Promise<string> {
  const absolutePath = resolve(filePath);
  const content = await readFile(absolutePath, "utf-8");
  return content.trim();
}
