import { PineconeStore } from "@langchain/pinecone";
import { Document } from "@langchain/core/documents";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { BaseVectorStore, VectorStoreErrorHandler } from "./base";
import type {
  VectorStoreConfig,
  SearchResult,
  SearchOptions,
  VectorStoreStats,
  FullTextSearchOptions,
  FullTextSearchResult,
  HybridSearchOptions,
} from "./types";

interface PineconeConfig extends VectorStoreConfig {
  apiKey?: string;
  namespace?: string;
  maxConcurrency?: number;
  sparseEncoder?: any;
}

export class PineconeVectorStore extends BaseVectorStore {
  protected store: PineconeStore | null = null;
  private pineconeClient: PineconeClient;
  private pineconeIndex: any;
  private namespace?: string;
  private maxConcurrency: number;
  private sparseEncoder?: any;
  private indexInitialized: boolean = false;

  constructor(config: PineconeConfig) {
    super(config);

    this.namespace = config.namespace;
    this.maxConcurrency = config.maxConcurrency || 5;
    this.sparseEncoder = config.sparseEncoder;

    if (!config.apiKey) {
      throw new Error("Pinecone API key is required");
    }

    this.pineconeClient = new PineconeClient({ apiKey: config.apiKey });
    this.pineconeIndex = this.pineconeClient.Index(config.collectionName!);
  }

  static async validateApiKey(
    config: Record<string, any>
  ): Promise<boolean | Error> {
    try {
      const client = new PineconeClient({ apiKey: config.apiKey });
      const { indexes } = await client.listIndexes();

      const indexExist = indexes?.find(
        (index) => index.name === config.collectionName
      );

      if (!indexExist) {
        return new Error(
          `Index "${config.collectionName}" does not exist. Please create it in Pinecone dashboard first.`
        );
      }

      return true;
    } catch (err) {
      console.error("✗ Pinecone validation failed:", err);
      return VectorStoreErrorHandler.handleError(
        "validate api key",
        err,
        false
      );
    }
  }

  supportsFullTextSearch(): boolean {
    return true;
  }

  /**
   * Optimized: Check index existence without unnecessary API calls
   */
  protected async storeExists(): Promise<boolean> {
    try {
      // Just check if we can connect - Pinecone indexes always "exist" once created
      if (!this.indexInitialized) {
        const indexStats = await this.pineconeIndex.describeIndexStats();
        this.indexInitialized = indexStats !== undefined;
      }
      return this.indexInitialized;
    } catch (error: any) {
      // 404 means index doesn't exist
      if (error?.status === 404 || error?.message?.includes("404")) {
        throw new Error(
          `Pinecone index "${this.config.collectionName}" not found. Please create it first in Pinecone dashboard.`
        );
      }
      return false;
    }
  }

  /**
   * Optimized: Single initialization path
   */
  protected async loadStore(): Promise<void> {
    await this.initializeStore();
  }

  protected async createStore(): Promise<void> {
    await this.initializeStore();
  }

  /**
   * Unified store initialization - avoids duplicate calls
   */
  private async initializeStore(): Promise<void> {
    if (this.store) return; // Already initialized

    try {
      this.store = await PineconeStore.fromExistingIndex(
        this.config.embeddings,
        {
          pineconeIndex: this.pineconeIndex,
          maxConcurrency: this.maxConcurrency,
          namespace: this.namespace,
        }
      );
      this.indexInitialized = true;
    } catch (error: any) {
      if (error?.status === 404 || error?.message?.includes("404")) {
        throw new Error(
          `Pinecone index "${this.config.collectionName}" not found. Create it at: https://app.pinecone.io`
        );
      }
      throw VectorStoreErrorHandler.handleError("initialize store", error);
    }
  }

  /**
   * Optimized: Batch document addition with chunking
   */
  protected async createStoreWithDocuments(
    documents: Document[]
  ): Promise<void> {
    try {
      // First ensure store is initialized
      await this.initializeStore();

      if (documents.length === 0) return;

      // Batch documents to avoid timeouts (Pinecone limit: ~1000 vectors/batch)
      const BATCH_SIZE = 100;
      const batches = this.chunkArray(documents, BATCH_SIZE);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        await this.store!.addDocuments(batch);

        // Small delay between batches to avoid rate limits
        if (i < batches.length - 1) {
          await this.delay(100);
        }
      }
    } catch (error: any) {
      if (error?.status === 404 || error?.message?.includes("404")) {
        throw new Error(
          `Pinecone index "${this.config.collectionName}" not found. Please create it first.`
        );
      }
      throw VectorStoreErrorHandler.handleError(
        "create store with documents",
        error
      );
    }
  }

  /**
   * Override addDocuments to use optimized batching
   */
  async addDocuments(
    documents: Document[],
    ids?: string[]
  ): Promise<string[] | void> {
    this.ensureInitialized();

    if (documents.length === 0) return [];

    try {
      const normalizedDocs = this.normalizeDocuments(documents);

      // Batch processing for large document sets
      const BATCH_SIZE = 100;
      if (normalizedDocs.length > BATCH_SIZE) {
        const batches = this.chunkArray(normalizedDocs, BATCH_SIZE);
        const allIds: string[] = [];

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const batchIds = ids?.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

          const addedIds = await this.store!.addDocuments(batch, {
            ids: batchIds,
          });

          if (addedIds) allIds.push(...addedIds);

          // Rate limiting
          if (i < batches.length - 1) {
            await this.delay(100);
          }
        }

        return allIds;
      }

      // Small batch - add directly
      return await this.store!.addDocuments(normalizedDocs, { ids });
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("add documents", error);
    }
  }

  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    try {
      const topK = options?.topK || 4;
      const minScore = options?.minScore || 0;

      const results = await this.store!.similaritySearchWithScore(
        query,
        topK,
        options?.filter
      );

      return results
        .filter(([_, score]) => score >= minScore)
        .map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: score,
        }));
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search", error);
    }
  }

  async fullTextSearch(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    try {
      const topK = options?.topK || 4;
      const minScore = options?.minScore || 0;

      const sparseValues = await this.generateSparseEmbeddings(query);

      const queryResponse = await this.pineconeIndex
        .namespace(this.namespace || "")
        .query({
          topK,
          sparseVector: sparseValues,
          includeMetadata: true,
          includeValues: false,
          filter: options?.filter,
        });

      return queryResponse.matches
        .filter((match: any) => match.score >= minScore)
        .map((match: any) => ({
          content: match.metadata?.text || "",
          metadata: match.metadata || {},
          score: match.score,
          searchType: "mrr" as const,
        }));
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("full-text search", error);
    }
  }

  async hybridSearch(
    query: string,
    options?: HybridSearchOptions
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    try {
      const topK = options?.topK || 4;
      const minScore = options?.minScore || 0;
      const alpha = options?.alpha ?? 0.5;

      const denseVector = await this.config.embeddings.embedQuery(query);
      const sparseVector = await this.generateSparseEmbeddings(query);

      const queryResponse = await this.pineconeIndex
        .namespace(this.namespace || "")
        .query({
          topK,
          vector: denseVector,
          sparseVector: sparseVector,
          includeMetadata: true,
          includeValues: false,
          filter: options?.filter,
          alpha: alpha,
        });

      return queryResponse.matches
        .filter((match: any) => match.score >= minScore)
        .map((match: any) => ({
          content: match.metadata?.text || "",
          metadata: match.metadata || {},
          score: match.score,
          searchType: "hybrid" as const,
        }));
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("hybrid search", error);
    }
  }

  private async generateSparseEmbeddings(
    text: string
  ): Promise<{ indices: number[]; values: number[] }> {
    if (this.sparseEncoder) {
      return await this.sparseEncoder.encodeQuery(text);
    }

    const tokens = text.toLowerCase().split(/\s+/);
    const tokenCounts = new Map<string, number>();

    tokens.forEach((token) => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    });

    const indices: number[] = [];
    const values: number[] = [];

    Array.from(tokenCounts.entries()).forEach(([token, count]) => {
      const index = this.hashToken(token);
      indices.push(index);
      values.push(count);
    });

    return { indices, values };
  }

  private hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100000;
  }

  async save(): Promise<void> {
    // Pinecone auto-saves
    return Promise.resolve();
  }

  async getStats(): Promise<VectorStoreStats> {
    const baseStats = await super.getStats();

    try {
      // const indexStats = await this.pineconeIndex.describeIndexStats();
      return {
        ...baseStats,
        supportsFullTextSearch: true,
        // totalVectors: indexStats.totalRecordCount,
      };
    } catch (error) {
      return baseStats;
    }
  }

  async delete(ids: string[]): Promise<void> {
    this.ensureInitialized();

    try {
      await this.store!.delete({ ids });
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("delete documents", error);
    }
  }

  async deleteAll(): Promise<void> {
    this.ensureInitialized();

    try {
      if (this.namespace) {
        await this.pineconeIndex.namespace(this.namespace).deleteAll();
      } else {
        await this.pineconeIndex.deleteAll();
      }
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("delete all documents", error);
    }
  }

  getPineconeIndex() {
    return this.pineconeIndex;
  }

  setSparseEncoder(encoder: any) {
    this.sparseEncoder = encoder;
  }

  async close(): Promise<void> {
    await super.close();
  }

  // Helper methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
