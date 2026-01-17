import { Document } from "@langchain/core/documents";
import {
  PGVectorStore,
  type DistanceStrategy,
} from "@langchain/community/vectorstores/pgvector";
import { Pool, type PoolConfig, Client as PGClient } from "pg";
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
 * Filter operator types for PGVector metadata filtering
 */
type FilterOperator =
  | { in: string[] }
  | { notIn: string[] }
  | { arrayContains: string[] };

type FilterValue = string | number | boolean | FilterOperator;
type Filter = Record<string, FilterValue>;

/**
 * Extended config for PGVector-specific options
 */
export interface PGVectorConfig extends VectorStoreConfig {
  // Connection configuration
  connectionUrl?: string;
  postgresConnectionOptions?: PoolConfig;

  // Collection/namespace
  collectionName?: string;
  collectionTableName?: string;

  // Column names (with defaults)
  columns?: {
    idColumnName?: string;
    vectorColumnName?: string;
    contentColumnName?: string;
    metadataColumnName?: string;
  };

  // Vector search configuration
  distanceStrategy?: DistanceStrategy;

  // HNSW index configuration
  hnswIndex?: {
    enabled: boolean;
    dimensions: number;
    m?: number;
    efConstruction?: number;
  };

  // Hybrid search configuration
  hybridSearchConfig?: {
    enabled: boolean;
    fulltextWeight?: number;
    vectorWeight?: number;
    fulltextConfig?: string;
  };
}

// TODO;: recheck
/**
 * Extended search options for PGVector
 */
export interface PGVectorSearchOptions extends SearchOptions {
  tsQueryType?: "plainto" | "phraseto" | "websearch";
  filter?: Filter;
  offset?: number;
  scoreThreshold?: number;
}

/**
 * PGVector implementation with hybrid search support
 */
export class PGVectorVectorStore extends BaseVectorStore {
  protected store: PGVectorStore | null = null;
  private pool: Pool | null = null;
  private connectionUrl?: string;
  private postgresConnectionOptions?: PoolConfig;
  private collectionName?: string;
  private collectionTableName: string;
  private columns: Required<PGVectorConfig["columns"]>;
  private distanceStrategy: DistanceStrategy;
  private hnswIndex?: PGVectorConfig["hnswIndex"];
  private hybridSearchConfig?: PGVectorConfig["hybridSearchConfig"];

  constructor(config: PGVectorConfig) {
    super(config);

    this.connectionUrl = config.url;
    this.postgresConnectionOptions = config.postgresConnectionOptions;
    this.collectionName = config.collectionName;
    this.collectionTableName = config.collectionTableName || "collections";
    this.columns = {
      idColumnName: config.columns?.idColumnName || "id",
      vectorColumnName: config.columns?.vectorColumnName || "vector",
      contentColumnName: config.columns?.contentColumnName || "content",
      metadataColumnName: config.columns?.metadataColumnName || "metadata",
    };
    this.distanceStrategy = config.distanceStrategy || "cosine";
    this.hnswIndex = config.hnswIndex;
    this.hybridSearchConfig = config.hybridSearchConfig;
  }

  /**
   * Validate API key and connection without requiring collection name
   */
  static async validateApiKey(
    config: Record<string, any>
  ): Promise<boolean | Error> {
    try {
      const client: PGClient = new PGClient({
        user: config.user,
        password: config.password,
        ssl: config.ssl,
        host: config.host,
        port: config.port,
        database: config.database,
      });
      await client.connect();
      const maxListeners = client.getMaxListeners();
      console.log({ maxListeners });
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
   * Parse connection URL or create PoolConfig
   */
  private getPoolConfig(): PoolConfig {
    if (this.connectionUrl) {
      const url = new URL(this.connectionUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: url.username,
        password: url.password,
        ssl:
          url.searchParams.get("sslmode") === "require"
            ? { rejectUnauthorized: false }
            : undefined,
      };
    }

    if (this.postgresConnectionOptions) {
      return this.postgresConnectionOptions;
    }

    throw new Error(
      "Either connectionUrl or postgresConnectionOptions must be provided"
    );
  }

  /**
   * Check if the vector store table exists
   */
  protected async storeExists(): Promise<boolean> {
    const poolConfig = this.getPoolConfig();
    const tempPool = new Pool(poolConfig);

    try {
      const result = await tempPool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [this.tableName]
      );
      return result.rows[0].exists;
    } catch (error) {
      return false;
    } finally {
      await tempPool.end();
    }
  }

  /**
   * Load existing store
   */
  protected async loadStore(): Promise<void> {
    const poolConfig = this.getPoolConfig();
    this.pool = new Pool(poolConfig);

    const storeConfig = {
      pool: this.pool,
      tableName: this.tableName!,
      collectionName: this.collectionName!,
      collectionTableName: this.collectionTableName!,
      columns: this.columns,
      distanceStrategy: this.distanceStrategy,
    };

    this.store = new PGVectorStore(this.config.embeddings, storeConfig);
  }

  /**
   * Create new store with pgvector extension
   */
  protected async createStore(): Promise<void> {
    const poolConfig = this.getPoolConfig();
    this.pool = new Pool(poolConfig);

    // Ensure pgvector extension exists
    await this.pool.query("CREATE EXTENSION IF NOT EXISTS vector");

    // Create fulltext search configuration if hybrid search enabled
    if (this.hybridSearchConfig?.enabled) {
      await this.ensureFulltextSearchSetup();
    }

    const storeConfig = {
      pool: this.pool,
      tableName: this.tableName!,
      collectionName: this.collectionName,
      collectionTableName: this.collectionTableName,
      columns: this.columns,
      distanceStrategy: this.distanceStrategy,
    };

    this.store = await PGVectorStore.initialize(
      this.config.embeddings,
      storeConfig
    );

    // Create HNSW index if configured
    if (this.hnswIndex?.enabled) {
      await this.createHNSWIndex();
    }
  }

  /**
   * Create store with initial documents
   */
  protected async createStoreWithDocuments(
    documents: Document[]
  ): Promise<void> {
    await this.createStore();
    if (documents.length > 0) {
      await this.store?.addDocuments(documents);
    }
  }

  /**
   * Setup fulltext search (GIN index and tsvector column)
   */
  private async ensureFulltextSearchSetup(): Promise<void> {
    if (!this.pool) throw new Error("Pool not initialized");

    const contentColumn = this.columns?.contentColumnName;
    const tsConfig = this.hybridSearchConfig?.fulltextConfig || "english";

    try {
      await this.pool.query(`
        ALTER TABLE ${this.tableName} 
        ADD COLUMN IF NOT EXISTS content_tsv tsvector 
        GENERATED ALWAYS AS (to_tsvector('${tsConfig}', ${contentColumn})) STORED
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_content_tsv_idx 
        ON ${this.tableName} 
        USING GIN (content_tsv)
      `);
    } catch (error) {
      console.warn("Could not create fulltext search setup:", error);
    }
  }

  /**
   * Create HNSW index for approximate nearest neighbor search
   */
  private async createHNSWIndex(): Promise<void> {
    if (!this.store || !this.hnswIndex) return;

    try {
      await (this.store as any).createHnswIndex({
        dimensions: this.hnswIndex.dimensions,
        m: this.hnswIndex.m || 16,
        efConstruction: this.hnswIndex.efConstruction || 64,
      });
    } catch (error) {
      console.warn("Could not create HNSW index:", error);
    }
  }

  /**
   * Check if this provider supports full-text search
   */
  supportsFullTextSearch(): boolean {
    return this.hybridSearchConfig?.enabled || false;
  }

  /**
   * Standard vector similarity search
   */
  async search(
    query: string,
    options: PGVectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const { topK = 4, filter, scoreThreshold } = options;

    try {
      const results = await this.store?.similaritySearchWithScore(
        query,
        topK,
        filter
      );

      return (
        results
          ?.filter(([_, score]) => !scoreThreshold || score >= scoreThreshold)
          .map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score,
          })) || []
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search", error);
    }
  }

  /**
   * Perform full-text search using PostgreSQL's text search
   */
  async fullTextSearch(
    query: string,
    options: FullTextSearchOptions = {}
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    if (!this.supportsFullTextSearch()) {
      throw new Error(
        `Full-text search is not supported. Enable hybridSearch in config.`
      );
    }

    if (!this.pool) throw new Error("Pool not initialized");

    const {
      topK = 4,
      filter,
      scoreThreshold,
      tsQueryType = "websearch",
    } = options as PGVectorSearchOptions;

    const tsConfig = this.hybridSearchConfig?.fulltextConfig || "english";
    const filterClause = filter ? this.buildFilterClause(filter) : "";
    const tsFunction = `${tsQueryType}_to_tsquery`;

    try {
      const sql = `
        SELECT 
          id,
          ${this.columns?.contentColumnName} as content,
          ${this.columns?.metadataColumnName} as metadata,
          ts_rank(content_tsv, ${tsFunction}('${tsConfig}', $1)) as score
        FROM ${this.tableName}
        WHERE content_tsv @@ ${tsFunction}('${tsConfig}', $1)
        ${filterClause}
        ORDER BY score DESC
        LIMIT $2
      `;

      const result = await this.pool.query(sql, [query, topK]);

      return result.rows
        .filter((row) => !scoreThreshold || row.score >= scoreThreshold)
        .map((row) => ({
          id: row.id,
          content: row.content,
          metadata: row.metadata,
          score: row.score,
          searchType: "mrr",
        }));
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("fulltext search", error);
    }
  }

  /**
   * Perform hybrid search (vector + fulltext combined)
   */
  async hybridSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    if (!this.supportsFullTextSearch()) {
      throw new Error(
        `Hybrid search is not supported. Enable hybridSearch in config.`
      );
    }

    if (!this.pool) throw new Error("Pool not initialized");

    const {
      topK = 4,
      alpha = 0.5,
      filter,
      scoreThreshold,
    } = options as PGVectorSearchOptions & HybridSearchOptions;

    const vectorWeight = alpha;
    const fulltextWeight = 1 - alpha;
    const tsConfig = this.hybridSearchConfig?.fulltextConfig || "english";
    const textQuery = query;

    try {
      const embedding = await this.config.embeddings.embedQuery(query);
      const filterClause = filter ? this.buildFilterClause(filter) : "";

      const sql = `
        WITH vector_search AS (
          SELECT 
            id,
            ${this.columns?.contentColumnName} as content,
            ${this.columns?.metadataColumnName} as metadata,
            1 - (${this.columns?.vectorColumnName} <=> $1::vector) as vector_score
          FROM ${this.tableName}
          ${filterClause}
          ORDER BY ${this.columns?.vectorColumnName} <=> $1::vector
          LIMIT $2
        ),
        fulltext_search AS (
          SELECT 
            id,
            ${this.columns?.contentColumnName} as content,
            ${this.columns?.metadataColumnName} as metadata,
            ts_rank(content_tsv, websearch_to_tsquery('${tsConfig}', $3)) as fulltext_score
          FROM ${this.tableName}
          WHERE content_tsv @@ websearch_to_tsquery('${tsConfig}', $3)
          ${filterClause}
          ORDER BY fulltext_score DESC
          LIMIT $2
        )
        SELECT 
          COALESCE(v.id, f.id) as id,
          COALESCE(v.content, f.content) as content,
          COALESCE(v.metadata, f.metadata) as metadata,
          (COALESCE(v.vector_score, 0) * $4 + COALESCE(f.fulltext_score, 0) * $5) as combined_score
        FROM vector_search v
        FULL OUTER JOIN fulltext_search f ON v.id = f.id
        ORDER BY combined_score DESC
        LIMIT $2
      `;

      const result = await this.pool.query(sql, [
        `[${embedding.join(",")}]`,
        topK,
        textQuery,
        vectorWeight,
        fulltextWeight,
      ]);

      return result.rows
        .filter(
          (row) => !scoreThreshold || row.combined_score >= scoreThreshold
        )
        .map((row) => ({
          id: row.id,
          content: row.content,
          metadata: row.metadata,
          score: row.combined_score,
          searchType: "hybrid",
        }));
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("hybrid search", error);
    }
  }

  /**
   * Build SQL filter clause from filter object
   */
  private buildFilterClause(filter: Filter): string {
    const metadataColumn = this.columns?.metadataColumnName;
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === "object" && value !== null) {
        if ("in" in value) {
          conditions.push(
            `${metadataColumn}->>'${key}' = ANY(ARRAY[${value.in
              .map((v) => `'${v}'`)
              .join(",")}])`
          );
        } else if ("notIn" in value) {
          conditions.push(
            `${metadataColumn}->>'${key}' != ALL(ARRAY[${value.notIn
              .map((v) => `'${v}'`)
              .join(",")}])`
          );
        } else if ("arrayContains" in value) {
          conditions.push(
            `${metadataColumn}->>'${key}' @> '[${value.arrayContains
              .map((v) => `"${v}"`)
              .join(",")}]'`
          );
        }
      } else {
        conditions.push(`${metadataColumn}->>'${key}' = '${String(value)}'`);
      }
    }

    return conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";
  }

  /**
   * Save is a no-op for PGVector (auto-persisted)
   */
  async save(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Get statistics about the store
   */
  async getStats(): Promise<VectorStoreStats> {
    const baseStats = await super.getStats();

    if (!this.pool) {
      return baseStats;
    }

    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );

      return {
        ...baseStats,
        // documentCount: parseInt(result.rows[0].count),
      };
    } catch {
      return baseStats;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    await super.close();
  }
}
