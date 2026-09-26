export function chunkText(
  text: string,
  chunkSize = 250,
  overlap = 50,
): string[] {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) {
    return [];
  }

  const sentencePattern = /[^.!?]+[.!?]?/g;
  const sentences = Array.from(
    normalizedText.matchAll(sentencePattern),
    (match) => match[0].trim(),
  ).filter(Boolean);

  if (sentences.length === 0) {
    return [normalizedText];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  const flushChunk = (value: string): void => {
    if (value.trim()) {
      chunks.push(value.trim());
    }
  };

  const splitLongSentence = (sentence: string): string[] => {
    const words = sentence.split(/\s+/).filter(Boolean);
    const parts: string[] = [];
    for (let start = 0; start < words.length; start += chunkSize) {
      const part = words.slice(start, start + chunkSize).join(" ");
      if (part.trim()) {
        parts.push(part.trim());
      }
    }
    return parts;
  };

  for (const sentence of sentences) {
    if (sentence.length > chunkSize) {
      if (currentChunk) {
        flushChunk(currentChunk);
        currentChunk = "";
      }

      for (const part of splitLongSentence(sentence)) {
        flushChunk(part);
      }
      continue;
    }

    const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    if (candidate.length <= chunkSize) {
      currentChunk = candidate;
      continue;
    }

    flushChunk(currentChunk);
    currentChunk = sentence;
  }

  if (currentChunk) {
    flushChunk(currentChunk);
  }

  if (overlap > 0 && chunks.length > 1) {
    return chunks.map((chunk, index) => {
      if (index === 0) {
        return chunk;
      }

      const previousChunk = chunks[index - 1] ?? "";
      const overlapWords = previousChunk.split(/\s+/).slice(-Math.max(1, Math.floor(overlap / 5)));
      const overlapText = overlapWords.join(" ");

      return overlapText && !chunk.startsWith(overlapText)
        ? `${overlapText} ${chunk}`.trim()
        : chunk;
    });
  }

  return chunks;
}
