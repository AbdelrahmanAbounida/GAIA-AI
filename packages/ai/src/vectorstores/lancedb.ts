import { Document } from "@langchain/core/documents";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import * as fs from "fs/promises";
import { BaseVectorStore, VectorStoreErrorHandler } from "./base";
import type {
  VectorStoreConfig,
  SearchResult,
  SearchOptions,
  FullTextSearchOptions,
  FullTextSearchResult,
  HybridSearchOptions,
} from "./types";
import * as lancedb from "@lancedb/lancedb";

/**
 * LanceDB vector store implementation with full-text search support
 */
export class LanceDBVectorStore extends BaseVectorStore {
  private embeddingSize: number | null = null;
  private nativeTable: any = null; // Raw LanceDB table for FTS operations
  private ftsIndexCreated: boolean = false;

  constructor(config: VectorStoreConfig) {
    super(config);
    this.tableName = this.tableName || "default";
  }

  /**
   * LanceDB supports full-text search via BM25
   */
  supportsFullTextSearch(): boolean {
    return true;
  }

  /**
   * Validate API key and connection without requiring collection name
   */
  static async validateApiKey(
    config: Record<string, any>
  ): Promise<boolean | Error> {
    try {
      console.log({
        uri: config.uri || config.url,
        apiKey: config.apiKey,
        region: config.region,
      });
      const client = await lancedb.connect({
        uri: config.uri || config.url,
        apiKey: config.apiKey,
        region: config.region,
      });
      const tableNames = await client.tableNames();
      console.log({ tableNames });
      return true;
    } catch (err) {
      console.error("✗ LanceDB connection failed:", err);
      return VectorStoreErrorHandler.handleError(
        "validate api key",
        err,
        false
      );
    }
  }

  protected async storeExists(): Promise<boolean> {
    try {
      await fs.access(this.persistPath);
      const db = await lancedb.connect({ uri: this.persistPath });
      const tableNames = await db.tableNames();
      return tableNames?.includes(this.tableName!);
    } catch {
      return false;
    }
  }

  protected async loadStore(): Promise<void> {
    try {
      const db = await lancedb.connect(this.persistPath);
      this.nativeTable = await db.openTable(this.tableName!);
      this.store = new LanceDB(this.config.embeddings, {
        table: this.nativeTable,
      });

      // Check if FTS index exists
      await this.checkFTSIndex();
    } catch (error) {
      throw new Error(`Failed to load LanceDB table: ${error}`);
    }
  }

  protected async createStore(): Promise<void> {
    await fs.mkdir(this.persistPath, { recursive: true });

    try {
      const db = await lancedb.connect(this.persistPath);

      // Cache embedding size
      if (!this.embeddingSize) {
        this.embeddingSize = (
          await this.config.embeddings.embedQuery("test")
        ).length;
      }

      // Create table with ALL possible metadata fields defined upfront
      this.nativeTable = await db.createTable(this.tableName!, [
        {
          vector: Array(this.embeddingSize).fill(0),
          text: "Initialization document",
          id: "init",
          documentId: "",
          source: "",
          type: "init",
          chunkIndex: 0,
          totalChunks: 0,
          fileName: "",
          sourceType: "",
        },
      ]);

      this.store = new LanceDB(this.config.embeddings, {
        table: this.nativeTable,
      });
    } catch (error) {
      throw new Error(`Failed to create LanceDB table: ${error}`);
    }
  }

  protected async createStoreWithDocuments(
    documents: Document[]
  ): Promise<void> {
    await fs.mkdir(this.persistPath, { recursive: true });

    const normalizedDocs = this.normalizeDocuments(documents);

    this.store = await LanceDB.fromDocuments(
      normalizedDocs,
      this.config.embeddings,
      {
        uri: this.persistPath,
        tableName: this.tableName,
      }
    );

    // Get native table reference
    const db = await lancedb.connect(this.persistPath);
    this.nativeTable = await db.openTable(this.tableName!);
  }

  protected normalizeDocuments(documents: Document[]): Document[] {
    return documents.map((doc) => {
      return new Document({
        pageContent: doc.pageContent,
        metadata: {
          documentId: doc.metadata.documentId || "",
          source: doc.metadata.source || "",
          type: doc.metadata.type || "document",
          chunkIndex: doc.metadata.chunkIndex || 0,
          totalChunks: doc.metadata.totalChunks || 0,
          fileName: doc.metadata.fileName || "",
          sourceType: doc.metadata.sourceType || "",
          ...doc.metadata,
        },
      });
    });
  }

  /**
   * Check if FTS index exists and create if needed
   */
  private async checkFTSIndex(): Promise<void> {
    if (!this.nativeTable) {
      return;
    }
    try {
      const indexes = await this.nativeTable.listIndices();
      // Check if text_idx exists
      this.ftsIndexCreated = indexes.some(
        (idx: any) => idx.name === "text_idx"
      );

      if (!this.ftsIndexCreated) {
        console.log("Creating FTS index on 'text' column...");
        await this.nativeTable.createIndex("text", {
          config: lancedb.Index.fts(),
        });
        this.ftsIndexCreated = true;
        console.log("FTS index created successfully");
      }
    } catch (error) {
      console.warn("Could not check/create FTS index:", error);
    }
  }

  /**
   * Ensure FTS index is created before full-text operations
   */
  private async ensureFTSIndex(): Promise<void> {
    if (!this.ftsIndexCreated) {
      await this.checkFTSIndex();
    }

    if (!this.ftsIndexCreated) {
      throw new Error(
        "FTS index not available. Make sure the table has a 'text' column."
      );
    }
  }

  async addTexts(
    texts: string[],
    metadatas?: Record<string, any>[],
    ids?: string[]
  ): Promise<string[] | void> {
    this.ensureInitialized();

    if (texts.length === 0) {
      return [];
    }

    try {
      const stats = await this.getStats();

      // For LanceDB, use fromTexts if creating new store
      if (!stats.exists) {
        await fs.mkdir(this.persistPath, { recursive: true });
        this.store = await LanceDB.fromTexts(
          texts,
          metadatas || texts.map(() => ({})),
          this.config.embeddings,
          {
            uri: this.persistPath,
            tableName: this.tableName,
          }
        );

        // Get native table reference
        const db = await lancedb.connect(this.persistPath);
        this.nativeTable = await db.openTable(this.tableName!);

        return texts.map((_, i) => i.toString());
      }

      // Otherwise, convert to documents and add
      const documents = texts.map(
        (text, i) =>
          new Document({
            pageContent: text,
            metadata: metadatas?.[i] || {},
          })
      );

      return this.addDocuments(documents, ids);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("add texts", error);
    }
  }

  /**
   * Delete documents by IDs using native LanceDB API
   * @override - Custom implementation since LangChain wrapper doesn't support delete
   */
  async delete(ids: string[]): Promise<void> {
    this.ensureInitialized();

    if (!this.nativeTable) {
      throw new Error("Native table not initialized");
    }

    if (!ids || ids.length === 0) {
      return;
    }

    try {
      // LanceDB supports SQL-like delete operations
      const idList = ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(", ");
      const deleteCondition = `id IN (${idList})`;
      await this.nativeTable.delete(deleteCondition);
      await this.save();
    } catch (error) {
      console.log({ error });
      throw VectorStoreErrorHandler.handleError(
        "delete documents",
        error,
        undefined,
        this.config
      );
    }
  }

  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const { topK = 5, minScore = 0 } = options;

    try {
      const results =
        (await this.store?.similaritySearchWithScore(query, topK)) || [];

      const filtered = results
        .filter(([res, _]) => {
          const similarity = 1 / (1 + res.metadata?._distance!);
          return similarity >= minScore;
        })
        .map(([doc, _]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: 1 / (1 + doc.metadata._distance!) || 0,
        }));

      // If no results pass the filter, return top results with score 0
      if (!filtered.length) {
        return results.slice(0, topK)?.map(([doc, _]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: 0,
        }));
      }

      return filtered;
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search documents", error);
    }
  }

  /**
   * Perform full-text search using BM25
   */
  async fullTextSearch(
    query: string,
    options: FullTextSearchOptions = {}
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();
    await this.ensureFTSIndex();

    const { topK = 10, minScore = 0, filter } = options;

    try {
      // Build query using native LanceDB FTS
      let searchQuery = this.nativeTable.search(query, "fts").select(["text"]);

      // Apply limit
      searchQuery = searchQuery.limit(topK);

      // Apply filter if provided
      if (filter) {
        const whereClause = this.buildWhereClause(filter);
        if (whereClause) {
          searchQuery = searchQuery.where(whereClause);
        }
      }

      // Execute query
      const results = await searchQuery.toArray();

      // Transform results to match our interface
      return results
        .map((result: any) => ({
          content: result.text || result.pageContent || "",
          metadata: { ...result },
          score: result._score || 1.0,
          searchType: "mrr",
        }))
        .filter((result: any) => result.score >= minScore);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("full-text search", error);
    }
  }

  /**
   * Perform hybrid search combining vector and full-text search
   */
  async hybridSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();
    await this.ensureFTSIndex();

    const { topK = 10, minScore = 0, alpha = 0.5, filter } = options;

    try {
      // Create RRF reranker for combining results
      const reranker = await lancedb.rerankers.RRFReranker.create();

      // Get query embedding for vector search
      const queryVector = await this.config.embeddings.embedQuery(query);

      // Build hybrid query
      let hybridQuery = this.nativeTable
        .query()
        .fullTextSearch(query)
        .nearestTo(queryVector)
        .rerank(reranker)
        .select(["text"]);

      // Apply limit
      hybridQuery = hybridQuery.limit(topK);

      // Apply filter if provided
      if (filter) {
        const whereClause = this.buildWhereClause(filter);
        if (whereClause) {
          hybridQuery = hybridQuery.where(whereClause);
        }
      }

      // Execute query
      const results = await hybridQuery.toArray();

      // Transform results
      return results
        .map((result: any) => ({
          content: result.text || result.pageContent || "",
          metadata: { ...result },
          score: result._score || 1.0,
          searchType: "hybrid" as const,
        }))
        .filter((result: any) => result.score >= minScore);
    } catch (error) {
      // Fallback to manual hybrid search if reranker fails
      console.warn(
        "Reranker failed, falling back to manual hybrid search:",
        error
      );
      return this.manualHybridSearch(query, options);
    }
  }

  /**
   * Manual hybrid search implementation (fallback)
   */
  private async manualHybridSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<FullTextSearchResult[]> {
    const { topK = 10, alpha = 0.5 } = options;

    // Get vector search results
    const vectorResults = await this.search(query, { topK: topK * 2 });

    // Get full-text search results
    const textResults = await this.fullTextSearch(query, { topK: topK * 2 });

    // Merge results using base class helper
    const merged = this.mergeSearchResults(vectorResults, textResults, alpha);

    return merged.slice(0, topK);
  }

  /**
   * Build WHERE clause from filter object
   */
  private buildWhereClause(filter: Record<string, any>): string {
    const conditions = Object.entries(filter)
      .map(([key, value]) => {
        if (typeof value === "string") {
          return `${key}='${value.replace(/'/g, "''")}'`;
        } else if (typeof value === "number") {
          return `${key}=${value}`;
        } else if (typeof value === "boolean") {
          return `${key}=${value}`;
        }
        return null;
      })
      .filter(Boolean);

    return conditions.join(" AND ");
  }

  /**
   * Generate unique key for deduplication in hybrid search
   */
  protected getResultKey(result: SearchResult | FullTextSearchResult): string {
    // Use metadata ID or content hash
    if (result.metadata.id) {
      return result.metadata.id;
    }
    if (result.metadata.documentId) {
      return result.metadata.documentId;
    }
    // Fallback to content-based key
    return result.content.substring(0, 100);
  }

  async save(): Promise<void> {
    this.ensureInitialized();
    // LanceDB auto-persists to disk, no explicit save needed
    console.log(`LanceDB automatically persisted to ${this.persistPath}`);
  }

  async close(): Promise<void> {
    if (this.store) {
      this.store = null;
      this.nativeTable = null;
      this.ftsIndexCreated = false;
      console.log("LanceDB connection closed");
    }
  }
}
