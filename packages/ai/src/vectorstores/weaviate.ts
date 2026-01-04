import { Document } from "@langchain/core/documents";
import { WeaviateStore } from "@langchain/weaviate";
import weaviate, { type WeaviateClient } from "weaviate-client";
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

/**
 * Extended config for Weaviate-specific options
 */
interface WeaviateConfig extends VectorStoreConfig {
  url?: string;
  apiKey?: string;
}

/**
 * Weaviate vector store implementation with full-text search support
 */
export class WeaviateVectorStore extends BaseVectorStore {
  private client: WeaviateClient | null = null;
  private collectionName: string;
  private url: string;
  private apiKey?: string;

  constructor(config: WeaviateConfig) {
    super(config);

    const rawCollectionName =
      config.tableName ||
      config.collection ||
      config.projectId ||
      "DefaultCollection";

    if (!rawCollectionName) {
      throw new Error(
        "Collection name is required. Provide tableName, collection, or projectId in config"
      );
    }

    // Normalize collection name to match Weaviate's capitalization convention
    this.collectionName = this.normalizeCollectionName(rawCollectionName);

    this.url = config.url!;
    this.apiKey = config.apiKey!;

    console.log(
      `🔍 WeaviateVectorStore initialized with collection: "${this.collectionName}"`
    );
  }

  /**
   * Normalize collection name to match Weaviate's convention
   * Weaviate capitalizes the first letter of collection names
   */
  private normalizeCollectionName(name: string): string {
    if (!name) return name;
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Validate API key and connection without requiring collection name
   */
  static async validateApiKey(
    config: Record<string, any>
  ): Promise<boolean | Error> {
    try {
      const client: WeaviateClient = await weaviate.connectToWeaviateCloud(
        config.url,
        {
          authCredentials: new weaviate.ApiKey(config.apiKey),
        }
      );

      const collectionName =
        config.collection || config.collectionName || config.tableName;

      if (collectionName) {
        // Normalize collection name for validation
        const normalizedName =
          collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
        const collectionExists =
          await client.collections.exists(normalizedName);
        console.log(
          `✓ Collection "${normalizedName}" exists:`,
          collectionExists
        );
      }

      await client.close();
      return true;
    } catch (err) {
      console.error("✗ Weaviate connection failed:", err);
      return VectorStoreErrorHandler.handleError(
        "validate api key",
        err,
        false
      );
    }
  }

  /**
   * Initialize Weaviate client and connect
   */
  private async initializeClient(): Promise<void> {
    if (this.client) {
      return;
    }

    try {
      const url = this.url;

      if (url.includes("weaviate.cloud") || url.includes("wcs.api")) {
        // Cloud deployment
        this.client = await weaviate.connectToWeaviateCloud(url, {
          authCredentials: new weaviate.ApiKey(this.apiKey || ""),
          headers: {
            "X-OpenAI-Api-Key": "",
          },
        });
      } else if (url.includes("localhost") || url.includes("127.0.0.1")) {
        // Local deployment
        this.client = await weaviate.connectToLocal({
          host: url,
        });
      } else {
        // Custom deployment
        this.client = await weaviate.connectToCustom({
          httpHost: url,
          httpPort: 443,
          httpSecure: true,
          authCredentials: new weaviate.ApiKey(this.apiKey || ""),
          headers: {
            "X-OpenAI-Api-Key": "",
          },
        });
      }

      console.log(`✓ Connected to Weaviate at ${url}`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "initialize Weaviate client",
        error
      );
    }
  }

  /**
   * Check if the collection exists in Weaviate
   */
  protected async storeExists(): Promise<boolean> {
    await this.initializeClient();

    try {
      if (!this.collectionName) {
        console.error("❌ Collection name is undefined in storeExists");
        return false;
      }

      const collections = await this.client?.collections.listAll();
      console.log(
        "Available collections:",
        collections?.map((c) => c.name)
      );

      const exists = await this.client?.collections.exists(this.collectionName);

      console.log(`✓ Collection "${this.collectionName}" exists:`, exists);
      return exists || false;
    } catch (error) {
      console.error(
        `Error checking collection "${this.collectionName}" existence:`,
        error
      );
      return false;
    }
  }

  /**
   * Load existing Weaviate collection
   */
  protected async loadStore(): Promise<void> {
    await this.initializeClient();

    try {
      if (!this.collectionName) {
        throw new Error("Collection name is undefined");
      }

      this.store = new WeaviateStore(this.config.embeddings, {
        client: this.client!,
        indexName: this.collectionName,
      });

      console.log(
        `✓ Loaded WeaviateStore with collection "${this.collectionName}"`
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("load Weaviate store", error);
    }
  }

  /**
   * Create new Weaviate collection
   */
  protected async createStore(): Promise<void> {
    await this.initializeClient();

    try {
      if (!this.collectionName) {
        throw new Error("Collection name is undefined");
      }

      this.store = new WeaviateStore(this.config.embeddings, {
        client: this.client!,
        indexName: this.collectionName,
      });

      console.log(
        `✓ Created WeaviateStore with collection "${this.collectionName}"`
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("create Weaviate store", error);
    }
  }

  /**
   * Create store with initial documents
   */
  protected async createStoreWithDocuments(
    documents: Document[]
  ): Promise<void> {
    await this.initializeClient();

    try {
      if (!this.collectionName) {
        throw new Error("Collection name is undefined");
      }

      console.log(
        `📝 Creating store with ${documents.length} documents for collection "${this.collectionName}"`
      );

      // Check if collection exists
      const exists = await this.storeExists();

      if (exists) {
        console.log(
          `✓ Collection "${this.collectionName}" already exists, adding documents to it`
        );

        // Use existing collection
        this.store = new WeaviateStore(this.config.embeddings, {
          client: this.client!,
          indexName: this.collectionName,
        });

        // Add documents to existing collection
        await this.store.addDocuments(documents);
      } else {
        // Try to create new collection with documents
        try {
          this.store = await WeaviateStore.fromDocuments(
            documents,
            this.config.embeddings,
            {
              client: this.client!,
              indexName: this.collectionName,
            }
          );
          console.log(
            `✓ Created new collection "${this.collectionName}" with documents`
          );
        } catch (createError: any) {
          // If creation fails because collection already exists (race condition)
          if (
            createError.message?.includes("already exists") ||
            createError.message?.includes("422")
          ) {
            console.log(
              `✓ Collection "${this.collectionName}" was created by another process, using it`
            );

            // Fallback: use the existing collection
            this.store = new WeaviateStore(this.config.embeddings, {
              client: this.client!,
              indexName: this.collectionName,
            });

            // Add documents to the collection
            await this.store.addDocuments(documents);
          } else {
            // Re-throw if it's a different error
            throw createError;
          }
        }
      }
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "create store with documents",
        error
      );
    }
  }

  /**
   * Check if full-text search is supported (Weaviate supports it)
   */
  supportsFullTextSearch(): boolean {
    return true;
  }

  /**
   * Search for similar documents using vector similarity search
   */
  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    await this.ensureInitialized();

    if (!this.collectionName) {
      throw new Error("Collection name is undefined - cannot perform search");
    }

    const topK = options?.topK || 4;
    const minScore = options?.minScore;

    try {
      console.log(
        `🔍 Searching in collection "${this.collectionName}" with query: "${query}"`
      );

      const weaviateStore = this.store as WeaviateStore;
      const results = await weaviateStore.similaritySearchWithScore(
        query,
        topK
      );

      console.log(`✓ Found ${results.length} results`);

      // Map all results first
      const allMappedResults = results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score: score,
      }));

      console.log({ allMappedResults });

      // Apply filtering if minScore is provided
      if (minScore) {
        const filteredResults = allMappedResults.filter(
          (result) => result.score >= minScore
        );

        // If filtering produces zero results, return all results
        if (filteredResults.length === 0) {
          console.log(
            `⚠️ No results met minScore threshold (${minScore}), returning all ${allMappedResults.length} results`
          );
          return allMappedResults;
        }

        console.log(
          `✓ ${filteredResults.length} results met minScore threshold (${minScore})`
        );
        return filteredResults;
      }

      // No filtering needed
      return allMappedResults;
    } catch (error) {
      console.error(
        `❌ Search failed for collection "${this.collectionName}":`,
        error
      );
      throw VectorStoreErrorHandler.handleError("search", error);
    }
  }

  /**
   * Perform BM25 full-text keyword search
   */
  async fullTextSearch(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    await this.ensureInitialized();
    await this.initializeClient();

    if (!this.collectionName) {
      throw new Error(
        "Collection name is undefined - cannot perform full-text search"
      );
    }

    const topK = options?.topK || 4;
    const minScore = options?.minScore;

    try {
      const collection = this.client!.collections.get(this.collectionName);

      // Build BM25 query options
      const queryOptions: any = {
        limit: topK,
        returnMetadata: ["score"],
      };

      // Add filter if provided
      if (options?.filter) {
        queryOptions.filters = this.buildFilter(options.filter);
      }

      const response = await collection.query.bm25(query, queryOptions);

      return response.objects
        .filter((obj: any) => {
          const score = this.extractScore(obj);
          return !minScore || score >= minScore;
        })
        .map((obj: any) => ({
          content: this.extractContent(obj),
          metadata: this.extractMetadata(obj),
          score: this.extractScore(obj),
          searchType: "mrr" as const,
        }));
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("full-text search", error);
    }
  }

  /**
   * Perform hybrid search (combines vector and keyword search)
   */
  async hybridSearch(
    query: string,
    options?: HybridSearchOptions
  ): Promise<FullTextSearchResult[]> {
    await this.ensureInitialized();
    await this.initializeClient();

    if (!this.collectionName) {
      throw new Error(
        "Collection name is undefined - cannot perform hybrid search"
      );
    }

    const topK = options?.topK || 4;
    const alpha = options?.alpha ?? 0.5;
    const minScore = options?.minScore;

    try {
      const collection = this.client!.collections.get(this.collectionName);

      // Build hybrid query options
      const queryOptions: any = {
        limit: topK,
        alpha: alpha,
        returnMetadata: ["score", "explainScore"],
        fusionType: "RelativeScore",
      };

      // Add filter if provided
      if (options?.filter) {
        queryOptions.filters = this.buildFilter(options.filter);
      }

      const response = await collection.query.hybrid(query, queryOptions);

      return response.objects
        .filter((obj: any) => {
          const score = this.extractScore(obj);
          return !minScore || score >= minScore;
        })
        .map((obj: any) => ({
          content: this.extractContent(obj),
          metadata: this.extractMetadata(obj),
          score: this.extractScore(obj),
          searchType: "hybrid" as const,
        }));
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("hybrid search", error);
    }
  }

  /**
   * Helper: Extract content from Weaviate object
   */
  private extractContent(obj: any): string {
    const rawContent =
      obj.properties.text ??
      obj.properties.pageContent ??
      obj.properties.content ??
      "";

    return typeof rawContent === "string"
      ? rawContent
      : JSON.stringify(rawContent);
  }

  /**
   * Helper: Extract metadata from Weaviate object
   */
  private extractMetadata(obj: any): Record<string, any> {
    if (obj.properties.metadata) {
      const metadata = obj.properties.metadata;
      return typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    }

    const { text, pageContent, content, metadata, ...rest } = obj.properties;
    return rest;
  }

  /**
   * Helper: Extract score from Weaviate object
   */
  private extractScore(obj: any): number {
    if (obj.metadata?.score !== undefined) {
      return obj.metadata.score;
    }
    if (obj.properties?.score !== undefined) {
      return typeof obj.properties.score === "number"
        ? obj.properties.score
        : 0;
    }
    return 0;
  }

  /**
   * Helper: Build Weaviate filter from generic filter object
   */
  private buildFilter(filter: Record<string, any>): any {
    const collection = this.client!.collections.get(this.collectionName);

    const filters: any[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        filters.push(collection.filter.byProperty(key).equal(value));
      }
    }

    return filters.length === 1 ? filters[0] : undefined;
  }

  /**
   * Save is a no-op for Weaviate (auto-persisted)
   */
  async save(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Get statistics about the Weaviate collection
   */
  async getStats(): Promise<VectorStoreStats> {
    const baseStats = await super.getStats();

    if (!baseStats.exists || !this.client) {
      return baseStats;
    }

    try {
      const collection = this.client.collections.get(this.collectionName);
      const aggregate = await collection.aggregate.overAll();

      return {
        ...baseStats,
        supportsFullTextSearch: true,
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      return baseStats;
    }
  }

  /**
   * Close the Weaviate client connection
   */
  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      await super.close();
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("close connection", error);
    }
  }

  /**
   * Delete documents by documentId or ids
   */
  async delete(ids: string[], documentId: string): Promise<void> {
    try {
      await this.ensureInitialized();

      if (!this.collectionName) {
        throw new Error(
          "Collection name is undefined - cannot delete documents"
        );
      }

      if (documentId) {
        const collection = this.client!.collections.get(this.collectionName);
        await collection.data.deleteMany(
          collection.filter.byProperty("documentId").equal(documentId)
        );
        console.log(`✓ Deleted documents with documentId: ${documentId}`);
      }
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("delete documents", error);
    }
  }

  /**
   * Delete the entire collection
   */
  async deleteCollection(): Promise<void> {
    await this.initializeClient();

    try {
      if (!this.collectionName) {
        throw new Error(
          "Collection name is undefined - cannot delete collection"
        );
      }

      const exists = await this.storeExists();
      if (exists) {
        await this.client!.collections.delete(this.collectionName);
        this.store = null;
        console.log(`✓ Deleted collection "${this.collectionName}"`);
      } else {
        console.log(
          `✓ Collection "${this.collectionName}" does not exist, nothing to delete`
        );
      }
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("delete collection", error);
    }
  }
}
