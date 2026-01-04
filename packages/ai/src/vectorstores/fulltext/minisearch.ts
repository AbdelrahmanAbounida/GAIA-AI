import { Document } from "@langchain/core/documents";
import MiniSearch from "minisearch";
import * as fs from "fs/promises";
import * as path from "path";
import { BaseFullTextSearch } from "./base";
import {
  type FullTextSearchConfig,
  type FullTextSearchResult,
  type FullTextSearchOptions,
} from "./types";

/**
 * Document structure for MiniSearch indexing
 */
interface IndexedDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  [key: string]: any;
}

/**
 * MiniSearch implementation of full-text search
 * Provides in-memory full-text search with persistence support
 */
export class MiniSearchFullTextSearch extends BaseFullTextSearch {
  private miniSearch: MiniSearch<IndexedDocument> | null = null;
  private indexFilePath: string;
  private documents: Map<string, IndexedDocument> = new Map();

  constructor(config: FullTextSearchConfig) {
    super(config);
    this.indexFilePath = path.join(
      "data",
      "vector_stores",
      "minisearch",
      this.persistPath,
      `${this.indexName}.json`
    );
  }

  /**
   * Check if index file exists on disk
   */
  protected async indexExists(): Promise<boolean> {
    try {
      await fs.access(this.indexFilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load existing index from disk
   */
  protected async loadIndex(): Promise<void> {
    try {
      const data = await fs.readFile(this.indexFilePath, "utf-8");
      const parsed = JSON.parse(data);

      // Restore documents map
      if (parsed.documents) {
        this.documents = new Map(Object.entries(parsed.documents));
      }

      // Create MiniSearch instance from saved state
      if (parsed.index) {
        this.miniSearch = MiniSearch.loadJSON(
          typeof parsed.index === "string"
            ? parsed.index
            : JSON.stringify(parsed.index),
          {
            fields: ["content", ...(this.getSearchableFields() || [])],
            storeFields: ["id", "content", "metadata"],
            searchOptions: {
              boost: this.config.ftsConfig?.boost || { content: 2 },
              fuzzy: this.config.ftsConfig?.fuzzy || 0.2,
              prefix: this.config.ftsConfig?.prefix !== false,
            },
            ...this.config.ftsConfig,
          }
        );
      } else {
        // Fallback: create new instance if no index data
        this.miniSearch = new MiniSearch({
          fields: ["content", ...(this.getSearchableFields() || [])],
          storeFields: ["id", "content", "metadata"],
          searchOptions: {
            boost: this.config.ftsConfig?.boost || { content: 2 },
            fuzzy: this.config.ftsConfig?.fuzzy || 0.2,
            prefix: this.config.ftsConfig?.prefix !== false,
          },
          ...this.config.ftsConfig,
        });
      }
    } catch (error) {
      throw this.handleError("load index", error);
    }
  }

  /**
   * Create new empty index
   */
  protected async createIndex(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.indexFilePath), { recursive: true });

      // Create new MiniSearch instance
      this.miniSearch = new MiniSearch({
        fields: ["content", ...(this.getSearchableFields() || [])],
        storeFields: ["id", "content", "metadata"],
        searchOptions: {
          boost: this.config.ftsConfig?.boost || { content: 2 },
          fuzzy: this.config.ftsConfig?.fuzzy || 0.2,
          prefix: this.config.ftsConfig?.prefix !== false,
        },
        ...this.config.ftsConfig,
      });

      this.documents = new Map();
      await this.save();
    } catch (error) {
      throw this.handleError("create index", error);
    }
  }

  /**
   * Index documents into MiniSearch
   */
  protected async indexDocuments(
    documents: Document[],
    ids: string[]
  ): Promise<void> {
    if (!this.miniSearch) {
      throw new Error("MiniSearch instance not initialized");
    }

    const indexedDocs: IndexedDocument[] = documents.map((doc, i) => {
      const indexedDoc: IndexedDocument = {
        id: ids[i],
        content: doc.pageContent,
        metadata: doc.metadata || {},
      };

      // Add metadata fields for searching if configured
      const searchableFields = this.getSearchableFields();
      if (searchableFields) {
        searchableFields.forEach((field) => {
          if (doc.metadata?.[field]) {
            indexedDoc[field] = doc.metadata[field];
          }
        });
      }

      // Store in documents map
      this.documents.set(ids[i], indexedDoc);

      return indexedDoc;
    });

    // Add to MiniSearch index
    this.miniSearch.addAll(indexedDocs);
  }

  /**
   * Search for documents
   */
  async search(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    if (!this.miniSearch) {
      throw new Error("MiniSearch instance not initialized");
    }

    try {
      const topK = options?.topK || 10;
      const minScore = options?.minScore || 0;

      // Perform search - only include defined options
      const searchOptions: any = {};

      // Add boost if defined
      const boost = options?.boost || this.config.ftsConfig?.boost;
      if (boost !== undefined) {
        searchOptions.boost = boost;
      }

      // Add fuzzy if defined
      const fuzzy = this.config.ftsConfig?.fuzzy;
      if (fuzzy !== undefined) {
        searchOptions.fuzzy = fuzzy;
      }

      // Add prefix if defined (default to true if not explicitly set to false)
      const prefix = this.config.ftsConfig?.prefix;
      if (prefix !== undefined) {
        searchOptions.prefix = prefix;
      } else {
        searchOptions.prefix = true; // default
      }

      // Apply filters if provided
      if (options?.filters) {
        searchOptions.filter = (result: any) => {
          const doc = this.documents.get(result.id);
          if (!doc) return false;

          return Object.entries(options.filters!).every(([key, value]) => {
            return doc.metadata[key] === value;
          });
        };
      }

      const results = this.miniSearch.search(query, searchOptions);

      // Convert to standard result format
      return results
        .slice(0, topK)
        .filter((result) => result.score >= minScore)
        .map((result) => {
          const doc = this.documents.get(result.id);
          return {
            id: result.id,
            content: doc?.content || "",
            metadata: doc?.metadata || {},
            score: result.score,
          };
        });
    } catch (error) {
      throw this.handleError("search", error);
    }
  }
  /**
   * Delete documents by IDs
   */
  async delete(ids: string[]): Promise<void> {
    this.ensureInitialized();

    if (!this.miniSearch) {
      throw new Error("MiniSearch instance not initialized");
    }

    try {
      // Remove from MiniSearch index
      ids.forEach((id) => {
        this.miniSearch!.discard(id);
        this.documents.delete(id);
      });

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

    if (!this.miniSearch) {
      throw new Error("MiniSearch instance not initialized");
    }

    try {
      this.miniSearch.removeAll();
      this.documents.clear();
      await this.save();
    } catch (error) {
      throw this.handleError("clear index", error);
    }
  }

  /**
   * Save the index to disk
   */
  async save(): Promise<void> {
    if (!this.miniSearch) {
      throw new Error("MiniSearch instance not initialized");
    }

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.indexFilePath), { recursive: true });

      const data = {
        index: this.miniSearch.toJSON(), // toJSON() already returns a string
        documents: Object.fromEntries(this.documents),
        config: this.config,
        savedAt: new Date().toISOString(),
      };

      await fs.writeFile(
        this.indexFilePath,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
    } catch (error) {
      throw this.handleError("save index", error);
    }
  }

  /**
   * Get document count
   */
  protected async getDocumentCount(): Promise<number> {
    return this.documents.size;
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<FullTextSearchResult | null> {
    this.ensureInitialized();

    const doc = this.documents.get(id);
    if (!doc) {
      return null;
    }

    return {
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      score: 1.0, // Default score for direct retrieval
    };
  }

  /**
   * Get auto-suggestions for a query
   */
  async autoSuggest(query: string, limit: number = 5): Promise<string[]> {
    this.ensureInitialized();

    if (!this.miniSearch) {
      throw new Error("MiniSearch instance not initialized");
    }

    try {
      const suggestions = this.miniSearch.autoSuggest(query, {
        boost: this.config.ftsConfig?.boost,
        fuzzy: this.config.ftsConfig?.fuzzy,
      });

      return suggestions.slice(0, limit).map((s) => s.suggestion);
    } catch (error) {
      throw this.handleError("auto-suggest", error);
    }
  }

  /**
   * Get all documents with optional filtering
   */
  async getAllDocuments(
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    try {
      let docs = Array.from(this.documents.values());

      // Apply filters if provided
      if (options?.filters) {
        docs = docs.filter((doc) => {
          return Object.entries(options.filters!).every(([key, value]) => {
            return doc.metadata[key] === value;
          });
        });
      }

      const topK = options?.topK || 100;

      return docs.slice(0, topK).map((doc) => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        score: 1.0,
      }));
    } catch (error) {
      throw this.handleError("get all documents", error);
    }
  }

  /**
   * Reset the index - delete file and recreate
   */
  async reset(): Promise<void> {
    try {
      // Delete the index file if it exists
      const exists = await this.indexExists();
      if (exists) {
        await fs.unlink(this.indexFilePath);
      }

      // Reset in-memory state
      this.miniSearch = null;
      this.documents.clear();
      this.initialized = false;

      // Recreate empty index
      await this.initialize();
    } catch (error) {
      throw this.handleError("reset index", error);
    }
  }

  /**
   * Get searchable fields from config
   */
  private getSearchableFields(): string[] | undefined {
    return this.config.ftsConfig?.searchableFields;
  }

  /**
   * Close and cleanup
   */
  async close(): Promise<void> {
    if (this.miniSearch) {
      await this.save();
    }
    this.miniSearch = null;
    this.documents.clear();
    await super.close();
  }
}
