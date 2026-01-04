import { Document as LangchainDocument } from "@langchain/core/documents";
import FlexSearch from "flexsearch";
import * as fs from "fs/promises";
import * as path from "path";
import {
  type FullTextSearchConfig,
  type FullTextSearchResult,
  type FullTextSearchOptions,
} from "./types";
import { BaseFullTextSearch } from "./base";

/**
 * FlexSearch implementation optimized for local and cloud deployment
 */
export class FlexSearchFullTextSearch extends BaseFullTextSearch {
  private index: FlexSearch.Index | null = null;
  private indexPath: string;
  private mounted: boolean = false;
  private documentStore: Map<string, { content: string; metadata: any }> =
    new Map();
  private useFileSystem: boolean;

  constructor(config: FullTextSearchConfig) {
    super(config);

    // ✅ FIX: Extract only the relative identifier from persistPath
    // The persistPath might be an absolute path like:
    // '/Users/.../data/vector_stores/lancedb/UUID'
    // We only want the UUID part for our FlexSearch directory

    const pathSegments = this.persistPath.split(path.sep);
    const lastSegment = pathSegments[pathSegments.length - 1] || this.indexName;

    // Create a clean FlexSearch-specific path
    const flexsearchDir = path.join(
      process.cwd(), // Use current working directory as base
      "data",
      "vector_stores",
      "flexsearch",
      lastSegment // Just use the UUID or identifier
    );

    this.indexPath = path.join(flexsearchDir, `${this.indexName}.json`);
    this.persistPath = flexsearchDir; // Update persistPath to be FlexSearch-specific

    this.useFileSystem = this.canUseFileSystem();
  }

  /**
   * Check if filesystem is available (not on Vercel edge/serverless)
   */
  private canUseFileSystem(): boolean {
    try {
      // Check if we're in a serverless environment
      if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the index file exists
   */
  protected async indexExists(): Promise<boolean> {
    if (!this.useFileSystem) return false;

    try {
      await fs.access(this.indexPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load existing index from file
   */
  protected async loadIndex(): Promise<void> {
    try {
      // Create FlexSearch index with optimized settings
      this.index = new FlexSearch.Index({
        tokenize: "forward",
        resolution: 9,
        cache: 100,
        context: {
          resolution: 5,
          depth: 3,
          bidirectional: true,
        },
      });

      // Load index data if exists and filesystem is available
      if (this.useFileSystem && (await this.indexExists())) {
        const data = await fs.readFile(this.indexPath, "utf-8");

        // Parse the exported data
        const lines = data.split("\n").filter((line) => line.trim());
        for (let i = 0; i < lines.length; i += 2) {
          if (lines[i] && lines[i + 1]) {
            const key = lines[i];
            const value = JSON.parse(lines[i + 1]);
            await this.index.import(key, value);
          }
        }

        this.mounted = true;
        console.log(`✓ Loaded FlexSearch index from: ${this.indexPath}`);
      } else {
        this.mounted = true;
        if (this.useFileSystem) {
          console.log(`✓ Created new FlexSearch index: ${this.indexPath}`);
        } else {
          console.log(
            `✓ Created new in-memory FlexSearch index (serverless mode)`
          );
        }
      }
    } catch (error) {
      throw new Error(`Failed to load FlexSearch index: ${error}`);
    }
  }

  /**
   * Create a new empty index
   */
  protected async createIndex(): Promise<void> {
    try {
      // Create new FlexSearch index with optimized settings
      this.index = new FlexSearch.Index({
        tokenize: "forward",
        resolution: 9,
        cache: 100,
        context: {
          resolution: 5,
          depth: 3,
          bidirectional: true,
        },
      });

      this.mounted = true;
      console.log(
        `✓ Created FlexSearch index: ${this.useFileSystem ? this.indexPath : "in-memory"}`
      );
    } catch (error) {
      throw new Error(`Failed to create FlexSearch index: ${error}`);
    }
  }

  /**
   * Index documents into FlexSearch
   */
  protected async indexDocuments(
    documents: LangchainDocument[],
    ids: string[]
  ): Promise<void> {
    if (!this.index || !this.mounted) {
      throw new Error("Index not initialized or mounted");
    }

    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const id = ids[i];

        // Store document content and metadata separately
        this.documentStore.set(id, {
          content: doc.pageContent,
          metadata: doc.metadata || {},
        });

        // Add to FlexSearch index using string ID
        await this.index.add(id, doc.pageContent);
      }

      // Save after indexing
      await this.save();
    } catch (error) {
      throw new Error(`Failed to index documents: ${error}`);
    }
  }

  /**
   * Search for documents matching the query
   */
  async search(
    query: string,
    options: FullTextSearchOptions = {}
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    if (!this.index || !this.mounted) {
      throw new Error("Index not initialized or mounted");
    }

    const { topK = 10, minScore = 0 } = options;

    try {
      // Perform search with context and suggestions
      const rawResults = await this.index.search(query, {
        limit: topK,
        suggest: true,
      });

      // Process results
      const results: FullTextSearchResult[] = [];

      for (let idx = 0; idx < rawResults.length; idx++) {
        const id = String(rawResults[idx]);
        const docData = this.documentStore.get(id);

        if (docData) {
          const score = 1 - idx / Math.max(rawResults.length, 1);

          if (score >= minScore) {
            results.push({
              id,
              content: docData.content,
              metadata: docData.metadata,
              score,
            });
          }
        }
      }

      return results;
    } catch (error) {
      throw this.handleError("search", error);
    }
  }

  /**
   * Delete documents by IDs
   */
  async delete(ids: string[]): Promise<void> {
    this.ensureInitialized();

    if (!this.index || !this.mounted) {
      throw new Error("Index not initialized or mounted");
    }

    try {
      for (const id of ids) {
        await this.index.remove(id);
        this.documentStore.delete(id);
      }

      await this.save();
    } catch (error) {
      throw this.handleError("delete documents", error);
    }
  }

  /**
   * Clear all documents from the index
   */
  async clear(): Promise<void> {
    this.ensureInitialized();

    try {
      if (this.index) {
        // Clear the index
        const allIds = Array.from(this.documentStore.keys());
        for (const id of allIds) {
          await this.index.remove(id);
        }
      }

      // Clear document store
      this.documentStore.clear();

      await this.save();
    } catch (error) {
      throw this.handleError("clear index", error);
    }
  }

  /**
   * Save the index to file (only if filesystem is available)
   */
  async save(): Promise<void> {
    if (!this.index || !this.mounted) {
      throw new Error("Index not initialized or mounted");
    }

    if (!this.useFileSystem) {
      // In serverless mode, we can't persist to filesystem
      return;
    }

    try {
      // ✅ Ensure directory exists before writing
      await this.ensureFileDirectory(this.indexPath);

      let exportedData = "";

      // Export FlexSearch index
      await this.index.export((key, data) => {
        exportedData += key + "\n" + JSON.stringify(data) + "\n";
      });

      // Save to file
      await fs.writeFile(this.indexPath, exportedData, "utf-8");

      // Save document store separately
      const docStorePath = path.join(
        this.persistPath,
        `${this.indexName}.docs.json`
      );
      await this.ensureFileDirectory(docStorePath);

      const docStoreData = JSON.stringify(
        Array.from(this.documentStore.entries())
      );
      await fs.writeFile(docStorePath, docStoreData, "utf-8");

      console.log(`✓ Saved FlexSearch index to: ${this.indexPath}`);
    } catch (error) {
      throw new Error(`Failed to save index: ${error}`);
    }
  }

  /**
   * Load document store from file
   */
  private async loadDocumentStore(): Promise<void> {
    if (!this.useFileSystem) return;

    try {
      const docStorePath = path.join(
        this.persistPath,
        `${this.indexName}.docs.json`
      );
      const data = await fs.readFile(docStorePath, "utf-8");
      const entries = JSON.parse(data);
      this.documentStore = new Map(entries);
    } catch (error) {
      // File doesn't exist yet, that's ok
      console.log("No existing document store found");
    }
  }

  /**
   * Get the total number of documents
   */
  protected async getDocumentCount(): Promise<number> {
    return this.documentStore.size;
  }

  /**
   * Close the index and cleanup
   */
  async close(): Promise<void> {
    try {
      if (this.mounted) {
        await this.save();
        this.mounted = false;
      }
      this.index = null;
      this.documentStore.clear();
      await super.close();
    } catch (error) {
      console.error("Error closing FlexSearch index:", error);
    }
  }

  /**
   * Get index file path
   */
  getIndexPath(): string {
    return this.indexPath;
  }

  /**
   * Check if index is mounted
   */
  isMounted(): boolean {
    return this.mounted;
  }

  /**
   * Override initialize to also load document store
   */
  async initialize(): Promise<void> {
    await super.initialize();
    await this.loadDocumentStore();
  }
}

/**
 * Factory function to create a FlexSearch index
 */
export function createFlexSearchIndex(
  config: FullTextSearchConfig
): FlexSearchFullTextSearch {
  return new FlexSearchFullTextSearch({
    ...config,
    provider: "flexsearch",
  });
}
