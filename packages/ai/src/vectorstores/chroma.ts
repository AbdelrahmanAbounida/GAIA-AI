import { Chroma } from "@langchain/community/vectorstores/chroma";
import { CloudClient, ChromaClient } from "chromadb";
import { Document } from "@langchain/core/documents";
import { BaseVectorStore, VectorStoreErrorHandler } from "./base";
import type {
  VectorStoreConfig,
  SearchResult,
  SearchOptions,
  VectorStoreStats,
} from "./types";

// TODO;: check chroma fulltextsearch with regex

/**
 * Extended config for Chroma-specific options
 */
export interface ChromaConfig extends VectorStoreConfig {
  host?: string;
  port?: number;
  ssl?: boolean;
  apiKey?: string;
  tenant?: string;
  database?: string;
}

/**
 * Chroma vector store implementation
 * Supports both local and cloud deployments
 */
export class ChromaVectorStore extends BaseVectorStore {
  protected store: Chroma | null = null;
  private chromaHost: string;
  private chromaPort: number;
  private chromaSsl: boolean;
  private apiKey?: string;
  private tenant?: string;
  private database?: string;
  private isCloudMode: boolean;
  private chromaClient: ChromaClient | CloudClient | null = null;

  constructor(config: ChromaConfig) {
    super(config);

    // Set defaults with environment variable fallbacks
    this.chromaHost = config.host!;
    this.chromaPort = config.port || 8000;
    this.chromaSsl = config.ssl ?? false;
    this.apiKey = config.apiKey;
    this.tenant = config.tenant;
    this.database = config.database;
    this.tableName = config.tableName || config.collection || config.projectId;

    // Determine if running in cloud mode
    this.isCloudMode = !!(this.apiKey && this.tenant && this.database);
  }

  /**
   * Validate API key and connection
   * For cloud: validates credentials
   * For local: validates server connectivity
   */
  static async validateApiKey(
    config: Record<string, any>
  ): Promise<boolean | Error> {
    try {
      const isCloud = !!(config.apiKey && config.tenant);

      if (isCloud) {
        // Validate Chroma Cloud connection
        const client = new CloudClient({
          apiKey: config.apiKey,
          tenant: config.tenant,
          database: config.database,
        });

        // Test connection by listing collections
        await client.listCollections();
        return true;
      } else {
        const client = new ChromaClient({
          port: config.port,
          host: config.host,
          ssl: config.ssl,
          database: config.database,
        });

        // Test connection by listing collections
        await client.listCollections();

        return true;
      }
    } catch (err) {
      console.error("✗ Chroma connection failed:", err);

      // Provide helpful error messages
      if (err instanceof TypeError && err.message.includes("fetch")) {
        return new Error(
          "Cannot connect to Chroma server. Make sure:\n" +
            "1. Chroma server is running\n" +
            "2. Host and port are correct\n" +
            "3. CORS is configured if accessing from browser (set CHROMA_SERVER_CORS_ALLOW_ORIGINS)"
        );
      }

      return VectorStoreErrorHandler.handleError(
        "validate connection",
        err,
        false
      );
    }
  }

  /**
   * Get or create ChromaClient instance
   */
  private async getChromaClient(): Promise<ChromaClient | CloudClient> {
    if (this.chromaClient) {
      return this.chromaClient;
    }
    if (this.isCloudMode) {
      this.chromaClient = new CloudClient({
        apiKey: this.apiKey!,
        tenant: this.tenant!,
        database: this.database!,
      });
    } else {
      this.chromaClient = new ChromaClient({
        host: this.chromaHost,
        port: this.chromaPort,
        ssl: this.chromaSsl,
        database: this.database,
      });
    }
    return this.chromaClient;
  }

  /**
   * Check if the Chroma collection exists
   */
  protected async storeExists(): Promise<boolean> {
    try {
      const client = await this.getChromaClient();
      const collections = await client.listCollections();
      const collectionExist = collections.some(
        (collection) => collection.name === this.tableName
      );
      if (!collectionExist) {
        await this.loadStore();
        await this.store?.ensureCollection();
      }
      return true; // NOTE:: no need to check the collection exist as it will be created by default
    } catch (error) {
      console.error("Error checking if collection exists:", error);
      return false;
    }
  }

  /**
   * Load existing Chroma collection
   */
  protected async loadStore(): Promise<void> {
    try {
      if (this.isCloudMode) {
        this.store = new Chroma(this.config.embeddings, {
          chromaCloudAPIKey: this.apiKey,
          collectionName: this.tableName,
          clientParams: {
            database: this.database,
            tenant: this.tenant,
            host: this.chromaHost || "api.trychroma.com",
            port: this.chromaPort || 8000,
            ssl: true,
          },
        });
      } else {
        this.store = new Chroma(this.config.embeddings, {
          collectionName: this.tableName,
          clientParams: {
            host: this.chromaHost,
            port: this.chromaPort,
            ssl: this.chromaSsl,
            database: this.database,
          },
        });
      }
      console.log(`✓ Loaded existing Chroma collection: ${this.tableName}`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("load store", error);
    }
  }

  /**
   * Create new Chroma collection
   * The Chroma constructor will automatically create the collection if it doesn't exist
   */
  protected async createStore(): Promise<void> {
    try {
      if (!this.store) {
        await this.loadStore();
      }
      await this.store?.ensureCollection();

      console.log(`✓ Created new Chroma collection: ${this.tableName}`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("create store", error);
    }
  }

  /**
   * Create store with initial documents
   */
  protected async createStoreWithDocuments(
    documents: Document[]
  ): Promise<void> {
    try {
      if (!this.store) {
        await this.createStore();
      }
      await this.store?.addDocuments(documents);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "create store with documents",
        error
      );
    }
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore;

    try {
      const results = await this.store?.similaritySearchWithScore(query, topK);

      return (
        results
          ?.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: score,
          }))
          .filter((result) => !minScore || result.score >= minScore) || []
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search", error);
    }
  }

  /**
   * Search with metadata filter
   */
  async searchWithFilter(
    query: string,
    filter: Record<string, any>,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore;

    try {
      const results = await this.store?.similaritySearchWithScore(
        query,
        topK,
        filter
      );

      return (
        results
          ?.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: score,
          }))
          .filter((result) => !minScore || result.score >= minScore) || []
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search with filter", error);
    }
  }

  /**
   * Delete documents by IDs
   */
  async delete(ids: string[]): Promise<void> {
    this.ensureInitialized();

    try {
      await this.store?.delete({ ids });
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("delete documents", error);
    }
  }

  /**
   * Delete the entire collection
   */
  async deleteCollection(): Promise<void> {
    try {
      const client = await this.getChromaClient();
      await client.deleteCollection({ name: this.tableName! });
      this.store = null;
      console.log(`✓ Deleted Chroma collection: ${this.tableName}`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("delete collection", error);
    }
  }

  /**
   * Save is a no-op for Chroma (auto-persisted)
   */
  async save(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Get statistics about the Chroma store
   */
  async getStats(): Promise<VectorStoreStats> {
    const baseStats = await super.getStats();
    // let documentCount = 0;
    // try {
    //   const client = await this.getChromaClient();
    //   const collections = await client.listCollections();
    //   documentCount = collections.length;
    // } catch (error) {
    //   console.log({ StatsError: error });
    //   console.warn("Could not fetch document count:", error);
    // }

    return {
      ...baseStats,
      provider: "chroma",
      // mode: this.isCloudMode ? "cloud" : "local",
      // documentCount,
    };
  }

  /**
   * Get as LangChain retriever
   */
  asRetriever(options?: { filter?: Record<string, any>; k?: number }) {
    this.ensureInitialized();

    return this.store?.asRetriever({
      filter: options?.filter,
      k: options?.k || 4,
    });
  }

  /**
   * Normalize documents to ensure consistent schema
   */
  protected normalizeDocuments(documents: Document[]): Document[] {
    return documents.map(
      (doc) =>
        new Document({
          pageContent: doc.pageContent || "",
          metadata: {
            ...doc.metadata,
            source: doc.metadata?.source || "unknown",
          },
        })
    );
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    this.chromaClient = null;
    await super.close();
  }
}
