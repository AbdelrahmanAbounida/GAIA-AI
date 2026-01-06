import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import type {
  IVectorStore,
  VectorStoreConfig,
  SearchResult,
  SearchOptions,
  VectorStoreStats,
  FullTextSearchOptions,
  FullTextSearchResult,
  HybridSearchOptions,
  FullTextSearchProviderId,
} from "./types";
import type {
  IFullTextSearch,
  FullTextSearchConfig,
  SearchType,
} from "./fulltext/types";
import type { FullTextSearchResult as FTSResult } from "./fulltext/types";
import * as path from "path";
import * as fs from "fs/promises";
/**
 * Abstract base class for vector store implementations
 */
export abstract class BaseVectorStore implements IVectorStore {
  protected store: VectorStore | null = null;
  protected config: VectorStoreConfig;
  protected persistPath: string;
  protected tableName?: string;

  // Full-text search support
  protected ftsInstance: IFullTextSearch | null = null;
  protected ftsProvider: FullTextSearchProviderId | null = null;

  constructor(config: VectorStoreConfig) {
    this.config = config;
    this.persistPath = config.persistDirectory!;
    this.tableName = config.tableName || config.collection || config.projectId;

    // Extract FTS configuration from config
    this.ftsProvider = config.fullTextSearchTool || null;
  }

  /**
   * Initialize or load the vector store
   */
  async initialize(): Promise<void> {
    console.log(`✅ Initializing ${this.config.provider} vector store...`);

    try {
      const exists = await this.storeExists();

      if (exists) {
        await this.loadStore();
        console.log(`✓ Loaded existing ${this.config.provider} index`);
      } else {
        await this.createStore();
        console.log(`✓ Created new ${this.config.provider} index`);
      }

      // ✅ Only initialize FTS if searchType requires it
      const searchType: SearchType = this.config.searchType || "hybrid";
      const needsFTS = searchType === "mrr" || searchType === "hybrid";

      console.log("✅ ✅✅✅✅✅✅✅✅✅✅");
      if (needsFTS) {
        console.log("✅ ✅✅✅✅✅✅✅✅✅✅");
        await this.initializeFullTextSearch();
      } else {
        console.log(
          `✓ Skipping FTS initialization (searchType: ${searchType})`
        );
      }
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "initialize vector store",
        error,
        undefined,
        this.config
      );
    }
  }

  /**
   * Initialize full-text search based on configuration
   */
  protected async initializeFullTextSearch(): Promise<void> {
    // Skip if no FTS provider specified
    if (!this.ftsProvider) {
      return;
    }

    // Skip if provider has native FTS and it's configured
    if (this.ftsProvider === "native" && this.supportsNativeFullTextSearch()) {
      console.log(`✓ Using native FTS for ${this.config.provider}`);
      return;
    }

    try {
      const pathParts = this.persistPath.split(path.sep);
      const projectId =
        this.config.projectId || pathParts[pathParts.length - 1];
      const baseDataDir = pathParts.slice(0, -2).join(path.sep);

      const ftsPersistDirectory = path.join(
        baseDataDir,
        this.ftsProvider,
        projectId
      );

      console.log(`📁 FTS provider: ${this.ftsProvider}`);
      console.log(`📁 FTS persist directory: ${ftsPersistDirectory}`);

      const ftsConfig: FullTextSearchConfig = {
        persistDirectory: ftsPersistDirectory,
        provider: this.ftsProvider,
        indexName: this.tableName || "default",
        ...(this.config.ftsConfig || {}),
      };

      await fs.mkdir(ftsPersistDirectory, { recursive: true, mode: 0o755 });
      console.log(
        `✓ Ensured FTS persist directory exists: ${ftsPersistDirectory}`
      );

      this.ftsInstance = await this.createFullTextSearchInstance(ftsConfig);
      await this.ftsInstance.initialize();

      console.log(
        `✓ Initialized ${this.ftsProvider} full-text search at ${ftsPersistDirectory}`
      );
    } catch (error) {
      console.warn(`⚠️ Failed to initialize FTS: ${error}`);
      this.ftsInstance = null;
    }
  }

  /**
   * Create full-text search instance (to be implemented by factory)
   */
  protected async createFullTextSearchInstance(
    config: FullTextSearchConfig
  ): Promise<IFullTextSearch> {
    // This will be injected by the factory or import the factory here
    const { createFullTextSearchInstance } = await import("./fulltext/factory");
    return createFullTextSearchInstance(config);
  }

  /**
   * validate apikey
   */
  static async validateApiKey(
    config: Partial<VectorStoreConfig>
  ): Promise<boolean | Error> {
    throw new Error("validateApiKey must be implemented by subclass");
  }

  /**
   * Check if vector store exists (implementation-specific)
   */
  protected abstract storeExists(): Promise<boolean>;

  /**
   * Load existing store (implementation-specific)
   */
  protected abstract loadStore(): Promise<void>;

  /**
   * Create new store (implementation-specific)
   */
  protected abstract createStore(): Promise<void>;

  /**
   * Create store with initial documents (implementation-specific)
   */
  protected abstract createStoreWithDocuments(
    documents: Document[]
  ): Promise<void>;

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
      const stats = await this.getStats();
      const normalizedDocs = this.normalizeDocuments(documents);

      if (!stats.exists) {
        await this.createStoreWithDocuments(normalizedDocs);
        const docIds = normalizedDocs.map((_, i) => ids?.[i] || i.toString());

        // Index to FTS if available
        await this.indexToFullTextSearch(normalizedDocs, docIds);

        return docIds;
      }

      const addedIds = await this.store?.addDocuments(normalizedDocs, { ids });
      await this.save();

      // Index to FTS if available
      await this.indexToFullTextSearch(normalizedDocs, addedIds || ids || []);

      return addedIds;
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "add documents",
        error,
        undefined,
        this.config
      );
    }
  }

  /**
   * Index documents to full-text search
   */
  protected async indexToFullTextSearch(
    documents: Document[],
    ids: string[]
  ): Promise<void> {
    if (!this.ftsInstance) {
      return;
    }

    try {
      await this.ftsInstance.addDocuments(documents, ids);
      console.log(`✓ Indexed ${documents.length} documents to FTS`);
    } catch (error) {
      console.warn(`⚠️ Failed to index to FTS: ${error}`);
      // Don't fail the main operation if FTS indexing fails
    }
  }

  /**
   * Add texts with metadata
   */
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
      const documents = texts.map(
        (text, i) =>
          new Document({
            pageContent: text,
            metadata: metadatas?.[i] || {},
          })
      );
      console.log(`📝 Adding ${texts.length} texts with custom IDs...`);
      return this.addDocuments(documents, ids);
    } catch (error) {
      console.log({ error });
      throw VectorStoreErrorHandler.handleError(
        "add texts",
        error,
        undefined,
        this.config
      );
    }
  }

  /**
   * Search for similar documents (implementation-specific scoring)
   */
  abstract search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]>;

  /**
   * Delete documents by IDs
   */
  async delete(ids: string[], documentId?: string): Promise<void> {
    this.ensureInitialized();
    try {
      await this.store?.delete({ ids });

      // Delete from FTS if available
      if (this.ftsInstance) {
        await this.ftsInstance.delete(ids);
      }

      await this.save();
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "delete documents",
        error,
        undefined,
        this.config
      );
    }
  }

  /**
   * Save the index to disk (implementation-specific)
   */
  abstract save(): Promise<void>;

  /**
   * Get the underlying vector store instance
   */
  getStore(): VectorStore {
    this.ensureInitialized();
    return this.store!;
  }

  /**
   * Get statistics about the store
   */
  async getStats(): Promise<VectorStoreStats> {
    return {
      provider: this.config.provider,
      persistPath: this.persistPath,
      tableName: this.tableName,
      exists: await this.storeExists(),
      supportsFullTextSearch: this.supportsFullTextSearch(),
    };
  }

  /**
   * Close the vector store connection
   */
  async close(): Promise<void> {
    if (this.ftsInstance) {
      await this.ftsInstance.close();
      this.ftsInstance = null;
    }
    this.store = null;
  }

  /**
   * Normalize documents for consistent schema (can be overridden)
   */
  protected normalizeDocuments(documents: Document[]): Document[] {
    return documents;
  }

  /**
   * Ensure store is initialized
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.store) {
      await this.initialize();
    }
  }

  /**
   * Check if this provider supports native full-text search
   * Override in subclasses that have native FTS (e.g., Weaviate, PGVector)
   */
  supportsNativeFullTextSearch(): boolean {
    return false;
  }

  /**
   * Check if full-text search is available (native or external)
   */
  supportsFullTextSearch(): boolean {
    return this.supportsNativeFullTextSearch() || this.ftsInstance !== null;
  }

  /**
   * Convert FTS result to FullTextSearchResult with searchType
   */
  protected convertToFullTextSearchResult(
    result: FTSResult,
    searchType: SearchType
  ): FullTextSearchResult {
    return {
      id: result.id,
      content: result.content,
      metadata: result.metadata,
      score: result.score,
      searchType: searchType,
    };
  }

  /**
   * Perform full-text search (BM25, keyword-based)
   */
  async fullTextSearch(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    if (!this.supportsFullTextSearch()) {
      throw new Error(
        `Full-text search is not supported by ${this.config.provider} provider`
      );
    }

    // Future:: Implement native FTS when provider supports it

    // Use external FTS provider
    if (this.ftsInstance) {
      const results = await this.ftsInstance.search(query, {
        ...options,
        searchType: options?.searchType || "mrr",
      });
      // Convert FTS results to include searchType
      return results.map((result) =>
        this.convertToFullTextSearchResult(result, "mrr")
      );
    }

    throw new Error("Full-text search not properly initialized");
  }

  /**
   * Future:: Native full-text search implementation (override in providers that support it)
   * This will be implemented in subclasses like Weaviate, PGVector that have native BM25/FTS support
   */
  protected async nativeFullTextSearch(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]> {
    throw new Error("nativeFullTextSearch must be implemented by subclass");
  }

  /**
   * Perform hybrid search (vector + full-text combined)
   */
  async hybridSearch(
    query: string,
    options?: HybridSearchOptions
  ): Promise<FullTextSearchResult[]> {
    if (!this.supportsFullTextSearch()) {
      throw new Error(
        `Hybrid search is not supported by ${this.config.provider} provider`
      );
    }

    try {
      const alpha = options?.alpha ?? 0.5;
      const topK = options?.topK ?? 10;

      // Perform both searches in parallel
      const [vectorResults, textResults] = await Promise.all([
        this.search(query, { topK, ...options }),
        this.fullTextSearch(query, { topK, ...options }),
      ]);

      // Merge and return results
      return this.mergeSearchResults(vectorResults, textResults, alpha);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError(
        "hybrid search",
        error,
        undefined,
        this.config
      );
    }
  }

  /**
   * Helper method to merge and deduplicate search results
   */
  protected mergeSearchResults(
    vectorResults: SearchResult[],
    textResults: FullTextSearchResult[],
    alpha: number = 0.5
  ): FullTextSearchResult[] {
    const resultMap = new Map<string, FullTextSearchResult>();

    // Add vector results with weighted scores
    vectorResults.forEach((result) => {
      const key = this.getResultKey(result);
      resultMap.set(key, {
        id: result.metadata.id || key,
        content: result.content,
        metadata: result.metadata,
        score: result.score * alpha,
        searchType: "hybrid",
      });
    });

    // Merge text results with weighted scores
    textResults.forEach((result) => {
      const key = this.getResultKey(result);
      const existing = resultMap.get(key);

      if (existing) {
        // Combine scores if result exists in both
        existing.score += result.score * (1 - alpha);
      } else {
        resultMap.set(key, {
          id: result.id,
          content: result.content,
          metadata: result.metadata,
          score: result.score * (1 - alpha),
          searchType: "hybrid",
        });
      }
    });

    // Sort by combined score and return
    return Array.from(resultMap.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Generate a unique key for a search result (for deduplication)
   */
  protected getResultKey(result: SearchResult | FullTextSearchResult): string {
    // Use ID from metadata if available, otherwise use content hash
    if ("id" in result) {
      return result.id!;
    }
    return result.metadata.id || result.content.substring(0, 100);
  }
}

/**
 * Centralized error handling for vector store operations
 */
export class VectorStoreErrorHandler {
  static handleError(
    operation: string,
    error: unknown,
    handleStack?: boolean,
    config?: VectorStoreConfig
  ): Error {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    const cause = error instanceof Error ? (error as any).cause : undefined;

    console.error(`❌ Error during ${operation}:`, {
      provider: config?.provider,
      operation,
      message,
      errorType: error?.constructor?.name,
      stack:
        handleStack !== false && stack
          ? stack.split("\n").slice(0, 5).join("\n")
          : undefined,
      cause: cause
        ? {
            message: cause.message,
            code: cause.code,
            type: cause.constructor?.name,
          }
        : undefined,
    });

    const enhancedMessage = this.enhanceErrorMessage(
      operation,
      message,
      cause,
      config
    );
    const newError = new Error(enhancedMessage);

    if (cause) {
      (newError as any).cause = cause;
    }

    if (handleStack !== false && stack) {
      newError.stack = stack;
    }

    return newError;
  }

  static enhanceErrorMessage(
    operation: string,
    message: string,
    cause?: any,
    config?: VectorStoreConfig
  ): string {
    const provider = config?.provider || "vector store";

    if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      return this.getConnectionErrorMessage(provider, cause);
    }

    if (
      message.includes("OIDC") ||
      message.includes("gateway") ||
      message.toLowerCase().includes("vercel_oidc_token")
    ) {
      return `Embeddings Failed. Please Check your Embedding Model Credentials`;
    }

    if (
      message.includes("401") ||
      message.includes("403") ||
      message.includes("Unauthorized") ||
      message.includes("authentication") ||
      message.toLowerCase().includes("forbidden")
    ) {
      return this.getAuthErrorMessage(provider);
    }

    if (message.includes("404") || message.includes("not found")) {
      return `${provider} resource not found during ${operation}. ${message}`;
    }

    if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
      return `${provider} connection timeout during ${operation}. The server may be slow or unreachable. ${message}`;
    }

    return `Failed to ${operation} in ${provider}: ${message}`;
  }

  private static getConnectionErrorMessage(
    provider: string,
    cause?: any
  ): string {
    const errorCode = cause?.code;
    const baseMessages: Record<string, string> = {
      qdrant:
        "Cannot connect to Qdrant. Ensure Qdrant is running (e.g., 'docker run -p 6333:6333 qdrant/qdrant') and accessible.",
      pinecone:
        "Cannot connect to Pinecone. Check your internet connection and Pinecone service status.",
      weaviate:
        "Cannot connect to Weaviate. Ensure Weaviate is running and accessible.",
      chroma:
        "Cannot connect to Chroma. Ensure Chroma server is running (e.g., 'chroma run --path ./chroma_data').",
      milvus:
        "Cannot connect to Milvus. Ensure Milvus is running and accessible.",
      pgvector:
        "Cannot connect to PostgreSQL database. Check your connection string and ensure the database is running.",
      supabase:
        "Cannot connect to Supabase. Check your credentials and internet connection.",
    };

    const baseMessage =
      baseMessages[provider] || `Cannot connect to ${provider} vector store.`;

    if (errorCode === "ECONNREFUSED") {
      return `${baseMessage} Connection refused - the service is not listening on the specified port.`;
    }

    return baseMessage;
  }

  private static getAuthErrorMessage(provider: string): string {
    const authMessages: Record<string, string> = {
      qdrant: "Invalid Qdrant API key. Check your apiKey config.",
      pinecone:
        "Invalid Pinecone API key. Check your PINECONE_API_KEY environment variable or apiKey config.",
      weaviate:
        "Invalid Weaviate credentials. Check your authentication settings.",
      milvus: "Invalid Milvus credentials. Check your authentication settings.",
      supabase:
        "Invalid Supabase credentials. Check your SUPABASE_URL and SUPABASE_KEY.",
    };

    return (
      authMessages[provider] ||
      `Authentication failed for ${provider}. Check your API key or credentials.`
    );
  }
}
