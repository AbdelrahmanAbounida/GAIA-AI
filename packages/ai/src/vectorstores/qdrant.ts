import { QdrantVectorStore as LangChainQdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { BaseVectorStore, VectorStoreErrorHandler } from "./base";
import { QdrantClient } from "@qdrant/js-client-rest";
import type {
  VectorStoreConfig,
  SearchResult,
  SearchOptions,
  FullTextSearchOptions,
  FullTextSearchResult,
  HybridSearchOptions,
} from "./types";
import * as fs from "fs/promises";

/**
 * Extended config for Qdrant-specific options
 */
interface QdrantConfig extends VectorStoreConfig {
  enableFullTextSearch?: boolean;
  sparseVectorName?: string;
  denseVectorName?: string;
}

/**
 * Qdrant filter type based on documentation
 */
interface QdrantFilter {
  must?: Array<any>;
  should?: Array<any>;
  must_not?: Array<any>;
  min_should?: { conditions: Array<any> };
}

/**
 * Qdrant vector store implementation with full-text and hybrid search support
 */
export class QdrantVectorStore extends BaseVectorStore {
  private qdrantUrl: string;
  private qdrantApiKey?: string;
  private collectionName: string;
  private enableFullText: boolean;
  private sparseVectorName: string;
  private denseVectorName: string;
  private connectionValidated: boolean = false;
  private client: QdrantClient | null = null;

  constructor(config: QdrantConfig) {
    super(config);

    this.qdrantUrl = config.url!;
    this.qdrantApiKey = config.apiKey;
    this.collectionName =
      config.tableName || config.collection || `gaia-${config.projectId}`;
    this.enableFullText = config.enableFullTextSearch ?? false;
    this.sparseVectorName = config.sparseVectorName || "bm25_sparse_vector";
    this.denseVectorName = config.denseVectorName || "dense_vector";
  }

  /**
   * Initialize Qdrant client
   */
  private getClient(config?: QdrantConfig): QdrantClient {
    const c = config || this.config;

    if (!this.client) {
      this.client = new LangChainQdrantVectorStore(c.embeddings, {
        url: c.url,
        apiKey: c.apiKey,
        collectionName: this.collectionName,
      }).client;
    }
    return this.client;
  }

  /**
   * Check if this provider supports full-text search
   */
  supportsFullTextSearch(): boolean {
    return this.enableFullText;
  }

  /**
   * Validate API key and connection without requiring collection name
   */
  static async validateApiKey(
    config: Record<string, any>
  ): Promise<boolean | Error> {
    try {
      const client = new QdrantClient({
        url: config.url,
        apiKey: config.apiKey,
      });
      await client.getCollections();

      if (config.collection || config.collectionName) {
        const collectionExist = await client.collectionExists(
          config.collection || config.collectionName
        );
        if (!collectionExist.exists) {
          // create collection if not exist
          // return new Error(
          //   `Collection ${config.collection || config.collectionName} does not exist`
          // );
        }
      }
      return true;
    } catch (err) {
      console.error("✗ Qdrant connection failed:", err);
      return VectorStoreErrorHandler.handleError(
        "validate api key",
        err,
        false
      );
    }
  }

  /**
   * Check if the Qdrant collection exists
   */
  protected async storeExists(): Promise<boolean> {
    try {
      if (!this.connectionValidated) {
        await QdrantVectorStore.validateApiKey(this.config);
        this.connectionValidated = true;
      }

      await this.ensureCollection();
      const client = this.getClient();
      const { exists } = await client.collectionExists(this.collectionName);

      if (exists) {
        console.log(`✓ Collection '${this.collectionName}' exists`);
      } else {
        console.log(`ℹ Collection '${this.collectionName}' does not exist yet`);
      }

      return exists;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Cannot connect") ||
          error.message.includes("Invalid") ||
          error.message.includes("permissions"))
      ) {
        throw error;
      }

      console.log(`ℹ Collection '${this.collectionName}' does not exist yet`);
      return false;
    }
  }

  /**
   * Ensure collection exists, create if it doesn't
   */
  private async ensureCollection(): Promise<void> {
    const exists = await this.storeExists();

    if (!exists) {
      console.log(`📝 Creating collection '${this.collectionName}'...`);

      if (this.enableFullText) {
        await this.createCollectionWithSparseVectors();
      } else {
        // Create basic collection with dense vectors only
        const client = this.getClient();
        const testEmbedding = await this.config.embeddings.embedQuery("test");
        const vectorSize = testEmbedding.length;

        await client.createCollection(this.collectionName, {
          vectors: {
            size: vectorSize,
            distance: "Cosine",
          },
        });

        console.log(`✓ Created collection '${this.collectionName}'`);
      }

      // Initialize store connection
      this.store = await LangChainQdrantVectorStore.fromExistingCollection(
        this.config.embeddings,
        {
          url: this.qdrantUrl,
          apiKey: this.qdrantApiKey,
          collectionName: this.collectionName,
        }
      );
    }
  }

  /**
   * Load existing Qdrant collection
   */
  protected async loadStore(): Promise<void> {
    try {
      if (!this.connectionValidated) {
        await QdrantVectorStore.validateApiKey(this.config);
        this.connectionValidated = true;
      }

      this.store = await LangChainQdrantVectorStore.fromExistingCollection(
        this.config.embeddings,
        {
          url: this.qdrantUrl,
          apiKey: this.qdrantApiKey,
          collectionName: this.collectionName,
        }
      );

      console.log(`✓ Loaded collection '${this.collectionName}'`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("load store", error);
    }
  }

  /**
   * Create new Qdrant collection with optional sparse vector support
   */
  protected async createStore(): Promise<void> {
    try {
      if (!this.connectionValidated) {
        await QdrantVectorStore.validateApiKey(this.config);
        this.connectionValidated = true;
      }

      await this.ensureCollection();
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("create store", error);
    }
  }

  /**
   * Create store with initial documents and optional BM25 sparse vectors
   */
  protected async createStoreWithDocuments(
    documents: Document[]
  ): Promise<void> {
    try {
      if (!this.connectionValidated) {
        await QdrantVectorStore.validateApiKey(this.config);
        this.connectionValidated = true;
      }

      await this.ensureCollection();

      if (this.enableFullText) {
        await this.addDocumentsWithSparseVectors(documents);
        console.log(
          `✓ Added ${documents.length} documents with sparse vectors`
        );
      } else {
        const client = this.getClient();
        const points = await Promise.all(
          documents.map(async (doc) => {
            const vector = await this.config.embeddings.embedQuery(
              doc.pageContent
            );
            return {
              id: require("uuid").v4(),
              vector,
              payload: {
                page_content: doc.pageContent,
                metadata: doc.metadata,
              },
            };
          })
        );

        await client.upsert(this.collectionName, {
          wait: true,
          points,
        });

        console.log(`✓ Added ${documents.length} documents`);
      }
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "create store with documents",
        error
      );
    }
  }

  /**
   * Create a Qdrant collection with both dense and sparse vector configurations
   */
  private async createCollectionWithSparseVectors(): Promise<void> {
    try {
      const client = this.getClient();
      const testEmbedding = await this.config.embeddings.embedQuery("test");
      const vectorSize = testEmbedding.length;

      console.log(`🔧 Creating collection with vector size: ${vectorSize}`);

      await client.createCollection(this.collectionName, {
        vectors: {
          [this.denseVectorName]: {
            size: vectorSize,
            distance: "Cosine",
          },
        },
        sparse_vectors: {
          [this.sparseVectorName]: {
            modifier: "idf",
          },
        },
      });

      console.log(`✓ Collection created with sparse vector support`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "create collection with sparse vectors",
        error
      );
    }
  }

  /**
   * Add documents with both dense and sparse (BM25) vectors
   */
  private async addDocumentsWithSparseVectors(
    documents: Document[],
    ids?: string[]
  ): Promise<void> {
    try {
      const client = this.getClient();

      const points = await Promise.all(
        documents.map(async (doc, idx) => {
          const denseVector = await this.config.embeddings.embedQuery(
            doc.pageContent
          );
          const sparseVector = this.computeBM25Vector(doc.pageContent);
          const pointId = ids?.[idx] || require("uuid").v4();

          return {
            id: pointId,
            vector: {
              [this.denseVectorName]: denseVector,
              [this.sparseVectorName]: sparseVector,
            },
            payload: {
              page_content: doc.pageContent,
              metadata: doc.metadata,
            },
          };
        })
      );

      await client.upsert(this.collectionName, {
        wait: true,
        points,
      });

      console.log(`✓ Added ${points.length} points with sparse vectors`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "add documents with sparse vectors",
        error
      );
    }
  }

  /**
   * Compute BM25 sparse vector representation
   */
  private computeBM25Vector(text: string): {
    indices: number[];
    values: number[];
  } {
    const tokens = text
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2);

    const termFreq = new Map<string, number>();
    tokens.forEach((token) => {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    });

    const indices: number[] = [];
    const values: number[] = [];

    termFreq.forEach((freq, term) => {
      const index = this.hashString(term) % 10000;
      indices.push(index);
      values.push(Math.log(1 + freq));
    });

    return { indices, values };
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Build Qdrant filter from simple key-value object
   * Handles nested metadata fields like "metadata.documentId"
   */
  private buildFilter(filter: Record<string, any>): QdrantFilter {
    const must: Array<any> = [];

    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        must.push({
          key: key,
          match: { value: value },
        });
      }
    }

    return must.length > 0 ? { must } : {};
  }

  /**
   * Standard vector search (dense vectors only)
   */
  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore || 0;

    try {
      const results = await this.store?.similaritySearchWithScore(query, topK);

      return (
        results
          ?.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: score,
          }))
          ?.filter((result) => result.score >= minScore)
          ?.sort((a, b) => b.score - a.score) || []
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search", error);
    }
  }

  /**
   * Full-text search using BM25 sparse vectors
   */
  async fullTextSearch(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    if (!this.supportsFullTextSearch()) {
      throw new Error(
        "Full-text search is not enabled. Set enableFullTextSearch: true in config."
      );
    }

    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore || 0;

    try {
      const client = this.getClient();
      const sparseVector = this.computeBM25Vector(query);

      const response = await client.query(this.collectionName, {
        query: sparseVector,
        using: this.sparseVectorName,
        limit: topK,
        with_payload: true,
      });

      const results = response.points || [];

      return results
        .map((point: any) => ({
          id: point.id,
          content: point.payload.page_content,
          metadata: point.payload.metadata,
          score: point.score,
          searchType: "mrr" as const,
        }))
        .filter((result: FullTextSearchResult) => result.score >= minScore)
        .sort(
          (a: FullTextSearchResult, b: FullTextSearchResult) =>
            b.score - a.score
        );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("full-text search", error);
    }
  }

  /**
   * Hybrid search using RRF (Reciprocal Rank Fusion)
   */
  async hybridSearch(
    query: string,
    options?: HybridSearchOptions
  ): Promise<FullTextSearchResult[]> {
    if (!this.supportsFullTextSearch()) {
      throw new Error(
        "Hybrid search is not enabled. Set enableFullTextSearch: true in config."
      );
    }

    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore || 0;

    try {
      const client = this.getClient();
      const denseVector = await this.config.embeddings.embedQuery(query);
      const sparseVector = this.computeBM25Vector(query);

      const response = await client.query(this.collectionName, {
        prefetch: [
          {
            query: sparseVector,
            using: this.sparseVectorName,
            limit: topK * 2,
          },
          {
            query: denseVector,
            using: this.denseVectorName,
            limit: topK * 2,
          },
        ],
        query: {
          fusion: "rrf",
        },
        limit: topK,
        with_payload: true,
      });

      const results = response.points || [];

      return results
        .map((point: any) => ({
          content: point.payload.page_content,
          metadata: point.payload.metadata,
          score: point.score,
          searchType: "hybrid" as const,
        }))
        .filter((result: FullTextSearchResult) => result.score >= minScore);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("hybrid search", error);
    }
  }

  /**
   * Search with metadata filter support
   */
  async searchWithFilter(
    query: string,
    filter: Record<string, any> | QdrantFilter,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore || 0;

    try {
      const qdrantFilter = this.isQdrantFilter(filter)
        ? filter
        : this.buildFilter(filter);

      const results = await this.store?.similaritySearchWithScore(
        query,
        topK,
        qdrantFilter
      );

      return (
        results
          ?.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: score,
          }))
          .filter((result) => result.score >= minScore)
          .sort((a, b) => b.score - a.score) || []
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search with filter", error);
    }
  }

  /**
   * Check if object is a Qdrant filter
   */
  private isQdrantFilter(obj: any): obj is QdrantFilter {
    return (
      typeof obj === "object" &&
      (obj.must !== undefined ||
        obj.should !== undefined ||
        obj.must_not !== undefined)
    );
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(
    documents: Document[],
    ids?: string[]
  ): Promise<string[] | void> {
    this.ensureInitialized();

    if (documents.length === 0) {
      return [];
    }

    try {
      await this.ensureCollection();

      const normalizedDocs = this.normalizeDocuments(documents);

      const validIds = ids?.map((id) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
          return id;
        }
        return require("uuid").v4();
      });

      if (this.enableFullText) {
        await this.addDocumentsWithSparseVectors(normalizedDocs, validIds);
        return validIds || normalizedDocs.map(() => require("uuid").v4());
      } else {
        const addedIds = await this.store?.addDocuments(normalizedDocs, {
          ids: validIds,
        });
        await this.save();
        return addedIds;
      }
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("add documents", error);
    }
  }

  /**
   * Delete points by IDs (legacy method, kept for compatibility)
   * we will be neglecting ids in this
   */
  async delete(ids: string[], documentId?: string): Promise<void> {
    try {
      const client = this.getClient();
      if (documentId) {
        let allPoints: any[] = [];
        let offset: any = null;

        do {
          const scrollResult = await client.scroll(this.collectionName, {
            limit: 100,
            offset: offset,
            with_payload: true,
            with_vector: false,
          });

          allPoints = allPoints.concat(scrollResult.points);
          offset = scrollResult.next_page_offset || null;

          // Break if no more pages
          if (!scrollResult.next_page_offset) break;
        } while (offset !== null);

        console.log(`Total points fetched: ${allPoints.length}`);

        const matchingPoints = allPoints.filter((point: any) => {
          return point.payload?.metadata?.documentId === documentId;
        });

        if (matchingPoints.length === 0) {
          console.log(`ℹ No points found with documentId: ${documentId}`);
          return;
        }

        const pointIds = matchingPoints.map((point: any) => point.id);

        // Delete by IDs in batches
        const batchSize = 100;
        for (let i = 0; i < pointIds.length; i += batchSize) {
          const batch = pointIds.slice(i, i + batchSize);
          await client.delete(this.collectionName, {
            wait: true,
            points: batch,
          });
          console.log(`✓ Deleted batch of ${batch.length} points`);
        }

        return;
      }
    } catch (error) {
      console.error("❌ Error deleting Qdrant points", error);
      throw error;
    }
  }

  /**
   * Count points with optional filter
   */
  async count(filter?: Record<string, any> | QdrantFilter): Promise<number> {
    try {
      const client = this.getClient();
      const qdrantFilter = filter
        ? this.isQdrantFilter(filter)
          ? filter
          : this.buildFilter(filter)
        : undefined;

      const response = await client.count(this.collectionName, {
        filter: qdrantFilter,
      });

      return response.count;
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("count", error);
      return 0;
    }
  }

  /**
   * Save is a no-op for Qdrant (auto-persisted)
   */
  async save(): Promise<void> {
    try {
      await fs.mkdir(this.persistPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Delete the collection
   */
  async deleteCollection(): Promise<void> {
    try {
      const client = this.getClient();

      await client.deleteCollection(this.collectionName);

      this.store = null;
      console.log(`✓ Collection '${this.collectionName}' deleted`);
    } catch (error) {
      if (error instanceof Error && !error.message.includes("404")) {
        throw VectorStoreErrorHandler.handleError("delete collection", error);
      }
      console.log(`ℹ Collection '${this.collectionName}' did not exist`);
    }
  }

  /**
   * Get collection info including vector configurations
   */
  async getCollectionInfo(): Promise<any> {
    try {
      const client = this.getClient();
      const info = await client.getCollection(this.collectionName);
      return info;
    } catch (error) {
      console.error("Error getting collection info:", error);
      return null;
    }
  }

  /**
   * Close connection and cleanup
   */
  async close(): Promise<void> {
    await super.close();
    this.connectionValidated = false;
    this.client = null;
  }
}
