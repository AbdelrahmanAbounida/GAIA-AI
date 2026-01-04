// services/chunking.ts
/**
 * Text chunking service for RAG pipeline
 * Supports multiple chunking strategies
 */

export interface ChunkingOptions {
  method: "fixed" | "sentence" | "paragraph" | "semantic";
  chunkSize: number;
  chunkOverlap: number;
}

export interface Chunk {
  content: string;
  index: number;
  metadata?: Record<string, any>;
}

/**
 * Main chunking function that delegates to specific strategies
 */
export function chunkText(text: string, options: ChunkingOptions): Chunk[] {
  switch (options.method) {
    case "fixed":
      return fixedSizeChunking(text, options);
    case "sentence":
      return sentenceBasedChunking(text, options);
    case "paragraph":
      return paragraphBasedChunking(text, options);
    case "semantic":
      return semanticChunking(text, options);
    default:
      return fixedSizeChunking(text, options);
  }
}

/**
 * Fixed-size chunking with overlap
 */
function fixedSizeChunking(text: string, options: ChunkingOptions): Chunk[] {
  const { chunkSize, chunkOverlap } = options;
  const chunks: Chunk[] = [];
  let index = 0;
  let position = 0;

  while (position < text.length) {
    const end = Math.min(position + chunkSize, text.length);
    const chunk = text.slice(position, end);

    chunks.push({
      content: chunk.trim(),
      index: index++,
      metadata: {
        startPosition: position,
        endPosition: end,
        method: "fixed",
      },
    });

    // Move position forward, accounting for overlap
    position += chunkSize - chunkOverlap;
  }

  return chunks.filter((c) => c.content.length > 0);
}

/**
 * Sentence-based chunking
 * Splits at sentence boundaries while respecting size limits
 */
function sentenceBasedChunking(
  text: string,
  options: ChunkingOptions
): Chunk[] {
  const { chunkSize, chunkOverlap } = options;
  const chunks: Chunk[] = [];

  // Split into sentences (basic implementation)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = "";
  let index = 0;
  let sentenceIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();

    if (
      (currentChunk + sentence).length > chunkSize &&
      currentChunk.length > 0
    ) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        index: index++,
        metadata: {
          sentenceStart: sentenceIndex,
          sentenceEnd: i - 1,
          method: "sentence",
        },
      });

      // Handle overlap by going back
      const overlapSentences = Math.floor(
        chunkOverlap / (chunkSize / (i - sentenceIndex))
      );
      const overlapStart = Math.max(sentenceIndex, i - overlapSentences);

      currentChunk = sentences.slice(overlapStart, i + 1).join(" ");
      sentenceIndex = overlapStart;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      index: index++,
      metadata: {
        sentenceStart: sentenceIndex,
        sentenceEnd: sentences.length - 1,
        method: "sentence",
      },
    });
  }

  return chunks;
}

/**
 * Paragraph-based chunking
 * Splits at paragraph boundaries
 */
function paragraphBasedChunking(
  text: string,
  options: ChunkingOptions
): Chunk[] {
  const { chunkSize, chunkOverlap } = options;
  const chunks: Chunk[] = [];

  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  let currentChunk = "";
  let index = 0;
  let paragraphIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();

    if (
      (currentChunk + paragraph).length > chunkSize &&
      currentChunk.length > 0
    ) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        index: index++,
        metadata: {
          paragraphStart: paragraphIndex,
          paragraphEnd: i - 1,
          method: "paragraph",
        },
      });

      // Handle overlap
      const overlapParagraphs = Math.floor(
        chunkOverlap / (chunkSize / (i - paragraphIndex))
      );
      const overlapStart = Math.max(paragraphIndex, i - overlapParagraphs);

      currentChunk = paragraphs.slice(overlapStart, i + 1).join("\n\n");
      paragraphIndex = overlapStart;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      index: index++,
      metadata: {
        paragraphStart: paragraphIndex,
        paragraphEnd: paragraphs.length - 1,
        method: "paragraph",
      },
    });
  }

  return chunks;
}

/**
 * Semantic chunking (simplified version)
 * In production, this would use embeddings to find semantic boundaries
 * For now, falls back to sentence-based with semantic hints
 */
function semanticChunking(text: string, options: ChunkingOptions): Chunk[] {
  // This is a placeholder - in production you'd:
  // 1. Split into sentences
  // 2. Generate embeddings for each sentence
  // 3. Calculate similarity between adjacent sentences
  // 4. Group sentences with high similarity
  // 5. Create chunks at semantic boundaries

  // For now, use sentence-based as fallback
  return sentenceBasedChunking(text, options);
}

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Process file content based on file type
 */
export async function processFileContent(
  file: File,
  options: ChunkingOptions
): Promise<Chunk[]> {
  const text = await readFileAsText(file);
  return chunkText(text, options);
}

/**
 * Read file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };

    reader.onerror = () => reject(new Error("File reading error"));
    reader.readAsText(file);
  });
}

/**
 * Process JSON content for RAG
 */
export function processJSONContent(
  jsonString: string,
  options: ChunkingOptions
): Chunk[] {
  try {
    const data = JSON.parse(jsonString);

    // Convert JSON to readable text format
    const text = convertJSONToText(data);

    return chunkText(text, options);
  } catch (error) {
    throw new Error("Invalid JSON content");
  }
}

/**
 * Convert JSON object to text representation
 */
function convertJSONToText(obj: any, prefix = ""): string {
  if (typeof obj !== "object" || obj === null) {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item, i) => convertJSONToText(item, `${prefix}[${i}]`))
      .join("\n");
  }

  return Object.entries(obj)
    .map(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null) {
        return convertJSONToText(value, path);
      }
      return `${path}: ${value}`;
    })
    .join("\n");
}
