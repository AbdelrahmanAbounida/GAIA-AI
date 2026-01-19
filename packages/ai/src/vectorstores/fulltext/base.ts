import { Document } from "@langchain/core/documents";
import * as fs from "fs/promises";
import * as path from "path";
import type {
  FullTextSearchConfig,
  IFullTextSearch,
  FullTextSearchResult,
  FullTextSearchOptions,
  FullTextSearchStats,
} from "./types";

/**
 * Abstract base class for full-text search implementations
 */
export abstract class BaseFullTextSearch implements IFullTextSearch {
  protected config: FullTextSearchConfig;
  protected persistPath: string;
  protected indexName: string;
  protected initialized: boolean = false;

  constructor(config: FullTextSearchConfig) {
    this.config = config;
    this.persistPath = config.persistDirectory;
    this.indexName = config.indexName || "fulltext_index";
  }

  /**
   * Initialize the search index
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // ✅ Ensure persist directory exists before checking for index
      await this.ensurePersistDirectory();

      const exists = await this.indexExists();

      if (exists) {
        await this.loadIndex();
      } else {
        await this.createIndex();
      }

      this.initialized = true;
    } catch (error) {
      console.error(
        `❌ Failed to initialize ${this.config.provider} index:`,
        error,
      );
      throw new Error(
        `Failed to initialize ${this.config.provider}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Ensure the persist directory exists
   */
  protected async ensurePersistDirectory(): Promise<void> {
    try {
      const absolutePath = path.isAbsolute(this.persistPath)
        ? this.persistPath
        : path.resolve(process.cwd(), this.persistPath);

      await fs.mkdir(absolutePath, { recursive: true, mode: 0o755 });
      this.persistPath = absolutePath;
    } catch (error) {
      console.error(
        `❌ Failed to create persist directory: ${this.persistPath}`,
        error,
      );
      throw new Error(
        `Failed to create persist directory: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Ensure a specific file's directory exists
   */
  protected async ensureFileDirectory(filePath: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(
        `❌ Failed to create file directory for: ${filePath}`,
        error,
      );
      throw new Error(
        `Failed to create directory for ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Check if index exists (implementation-specific)
   */
  protected abstract indexExists(): Promise<boolean>;

  /**
   * Load existing index (implementation-specific)
   */
  protected abstract loadIndex(): Promise<void>;

  /**
   * Create new index (implementation-specific)
   */
  protected abstract createIndex(): Promise<void>;

  /**
   * Add documents to the index
   */
  async addDocuments(documents: Document[], ids?: string[]): Promise<string[]> {
    this.ensureInitialized();

    if (documents.length === 0) {
      return [];
    }

    try {
      const normalizedDocs = this.normalizeDocuments(documents);
      const docIds = ids || normalizedDocs.map((_, i) => this.generateId(i));

      await this.indexDocuments(normalizedDocs, docIds);
      await this.save();

      return docIds;
    } catch (error) {
      console.error(
        `❌ Error adding documents to ${this.config.provider}:`,
        error,
      );
      throw this.handleError("add documents", error);
    }
  }

  /**
   * Add texts with metadata
   */
  async addTexts(
    texts: string[],
    metadatas?: Record<string, any>[],
    ids?: string[],
  ): Promise<string[]> {
    this.ensureInitialized();

    if (texts.length === 0) {
      return [];
    }

    try {
      const documents = texts.map(
        (text, i) =>
          new Document({
            pageContent: text,
            metadata: metadatas?.[i] || {},
          }),
      );

      return this.addDocuments(documents, ids);
    } catch (error) {
      throw this.handleError("add texts", error);
    }
  }

  /**
   * Index documents (implementation-specific)
   */
  protected abstract indexDocuments(
    documents: Document[],
    ids: string[],
  ): Promise<void>;

  /**
   * Search for documents (implementation-specific)
   */
  abstract search(
    query: string,
    options?: FullTextSearchOptions,
  ): Promise<FullTextSearchResult[]>;

  /**
   * Delete documents by IDs
   */
  abstract delete(ids: string[]): Promise<void>;

  /**
   * Clear all documents from the index
   */
  abstract clear(): Promise<void>;

  /**
   * Save the index to disk (implementation-specific)
   */
  abstract save(): Promise<void>;

  /**
   * Get statistics about the index
   */
  async getStats(): Promise<FullTextSearchStats> {
    return {
      provider: this.config.provider,
      persistPath: this.persistPath,
      indexName: this.indexName,
      documentCount: await this.getDocumentCount(),
      exists: await this.indexExists(),
    };
  }

  /**
   * Get document count (implementation-specific)
   */
  protected abstract getDocumentCount(): Promise<number>;

  /**
   * Close the search index
   */
  async close(): Promise<void> {
    this.initialized = false;
  }

  /**
   * Normalize documents for consistent schema
   */
  protected normalizeDocuments(documents: Document[]): Document[] {
    return documents.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        indexedAt: doc.metadata.indexedAt || new Date().toISOString(),
      },
    }));
  }

  /**
   * Generate a unique ID
   */
  protected generateId(index: number): string {
    return `${this.indexName}_${Date.now()}_${index}`;
  }

  /**
   * Ensure index is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        `${this.config.provider} full-text search index not initialized. Call initialize() first.`,
      );
    }
  }

  /**
   * Handle errors consistently
   */
  protected handleError(operation: string, error: unknown): Error {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Error during ${operation} in ${this.config.provider}:`,
      error,
    );
    return new Error(`Failed to ${operation}: ${message}`);
  }
}
