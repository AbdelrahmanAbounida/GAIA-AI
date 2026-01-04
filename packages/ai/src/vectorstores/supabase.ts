import { SupabaseVectorStore as LangChainSupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
 * ID handling strategy for Supabase
 */
export type IdStrategy =
  | "auto" // Let Supabase auto-generate IDs (bigserial/uuid default)
  | "preserve" // Keep document IDs from metadata
  | "strip"; // Remove IDs completely

/**
 * Extended config for Supabase-specific options
 */
export interface SupabaseConfig extends VectorStoreConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  queryName?: string;
  keywordQueryName?: string;
  upsertBatchSize?: number;
  embeddingDimension?: number;
  idStrategy?: IdStrategy;
  idColumn?: string; // Name of the ID column (default: 'id')
}

/**
 * Supabase vector store implementation with flexible schema support
 */
export class SupabaseVectorStore extends BaseVectorStore {
  protected store: LangChainSupabaseVectorStore | null = null;
  private client: SupabaseClient;
  private supabaseUrl: string;
  private supabaseKey: string;
  private queryName: string;
  private keywordQueryName: string;
  private upsertBatchSize: number;
  private embeddingDimension: number;
  private idStrategy: IdStrategy;
  private idColumn: string;

  constructor(config: SupabaseConfig) {
    super(config);

    // Validate required credentials
    this.supabaseUrl = config.url!;
    this.supabaseKey = config.apiKey!;

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error(
        "Supabase URL and Key are required. Set them in config or environment variables."
      );
    }

    // Set configuration with sensible defaults
    this.queryName = config.queryName || `match_${this.tableName}`;
    this.keywordQueryName =
      config.keywordQueryName || `kw_match_${this.tableName}`;
    this.upsertBatchSize = config.upsertBatchSize || 500;
    this.embeddingDimension = config.embeddingDimension || 1536;
    this.idStrategy = config.idStrategy || "auto";
    this.idColumn = config.idColumn || "id";

    // Initialize Supabase client
    this.client = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * Validate API key and connection
   */
  static async validateApiKey(
    config: Record<string, any>
  ): Promise<boolean | Error> {
    try {
      if (!config.url || !config.apiKey) {
        throw new Error("Supabase URL and API Key are required");
      }

      const client = createClient(config.url, config.apiKey);

      // Try a simple query to validate connection
      const { error } = await client.from("_").select("*").limit(0);

      // 404 means connection works but table doesn't exist (expected)
      // 401/403 means authentication failed
      if (
        error?.message?.includes("JWT") ||
        error?.message?.includes("apikey")
      ) {
        throw new Error("Invalid Supabase API key");
      }

      console.log("✓ Supabase connection validated");
      return true;
    } catch (err: any) {
      if (err.message?.includes("Invalid Supabase API key")) {
        throw err;
      }
      console.error("✗ Supabase connection failed:", err);
      return VectorStoreErrorHandler.handleError(
        "validate api key",
        err,
        false
      );
    }
  }

  /**
   * Check if this provider supports full-text search
   */
  supportsFullTextSearch(): boolean {
    return true;
  }

  /**
   * Check if the table exists in Supabase
   */
  protected async storeExists(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName!)
        .select(this.idColumn)
        .limit(1);

      if (error) {
        if (
          error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.code === "42P01"
        ) {
          return false;
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.warn(`Error checking if store exists:`, error);
      return false;
    }
  }

  /**
   * Load existing Supabase vector store
   */
  protected async loadStore(): Promise<void> {
    try {
      this.store = new LangChainSupabaseVectorStore(this.config.embeddings, {
        client: this.client,
        tableName: this.tableName,
        queryName: this.queryName,
      });
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("load store", error);
    }
  }

  /**
   * Create new Supabase vector store
   */
  protected async createStore(): Promise<void> {
    try {
      this.store = new LangChainSupabaseVectorStore(this.config.embeddings, {
        client: this.client,
        tableName: this.tableName,
        queryName: this.queryName,
      });

      console.log(`
        Note: Supabase table must exist. If not created, run:
        SupabaseVectorStore.getSetupSQL('${this.tableName}', ${this.embeddingDimension})
      `);
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
    await this.createStore();
    if (documents.length > 0) {
      await this.addDocuments(documents);
    }
  }

  /**
   * Add documents with flexible ID handling
   */
  async addDocuments(documents: Document[]): Promise<void> {
    this.ensureInitialized();

    try {
      const processedDocs = this.processDocumentsForInsertion(documents);

      // Process in batches
      for (let i = 0; i < processedDocs.length; i += this.upsertBatchSize) {
        const batch = processedDocs.slice(i, i + this.upsertBatchSize);
        await this.store?.addDocuments(batch);
      }

      console.log(`✓ Added ${documents.length} documents to ${this.tableName}`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("add documents", error);
    }
  }

  /**
   * Process documents based on ID strategy
   */
  private processDocumentsForInsertion(documents: Document[]): Document[] {
    return documents.map((doc) => {
      const processed = this.normalizeDocuments([doc])[0];

      switch (this.idStrategy) {
        case "strip":
          // Remove ID completely - let database handle it
          const { [this.idColumn]: _, ...metadataWithoutId } =
            processed.metadata;
          return {
            ...processed,
            metadata: metadataWithoutId,
          };

        case "auto":
          // Auto-detect: remove if string ID exists and looks generated
          if (processed.metadata[this.idColumn]) {
            const idValue = processed.metadata[this.idColumn];
            // Remove if it's a string that looks like a generated ID
            if (
              typeof idValue === "string" &&
              (idValue.includes("temp-") || idValue.includes("chunk-"))
            ) {
              const { [this.idColumn]: _, ...metadataWithoutId } =
                processed.metadata;
              return {
                ...processed,
                metadata: metadataWithoutId,
              };
            }
          }
          return processed;

        case "preserve":
          // Keep ID as-is from metadata
          return processed;

        default:
          return processed;
      }
    });
  }

  /**
   * Search for similar documents using cosine similarity
   */
  async search(
    query: string,
    options: SearchOptions = {}
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
            score,
          }))
          .filter((result) => !minScore || result.score >= minScore) || []
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search", error);
    }
  }

  /**
   * Perform full-text search using PostgreSQL's ts_rank
   */
  async fullTextSearch(
    query: string,
    options: FullTextSearchOptions = {}
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore;

    try {
      const { data, error } = await this.client.rpc(this.keywordQueryName, {
        query_text: query,
        match_count: topK,
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      const results: FullTextSearchResult[] = data
        .map((row: any) => ({
          content: row.content,
          metadata: row.metadata || {},
          score: row.similarity,
          searchType: "mrr" as const,
        }))
        .filter((result: any) => !minScore || result.score >= minScore);

      return results;
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("full-text search", error);
    }
  }

  /**
   * Perform hybrid search (vector + full-text combined)
   */
  async hybridSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<FullTextSearchResult[]> {
    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore;
    const alpha = options?.alpha ?? 0.5;

    try {
      const [vectorResults, textResults] = await Promise.all([
        this.search(query, { topK: topK * 2, filter: options?.filter }),
        this.fullTextSearch(query, { topK: topK * 2, filter: options?.filter }),
      ]);

      const mergedResults = this.mergeSearchResults(
        vectorResults,
        textResults,
        alpha
      );

      return mergedResults
        .filter((result) => !minScore || result.score >= minScore)
        .slice(0, topK);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("hybrid search", error);
    }
  }

  /**
   * Search with metadata filtering
   */
  async searchWithFilter(
    query: string,
    filterFn: (rpc: any) => any,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const topK = options?.topK || 4;
    const minScore = options?.minScore;

    try {
      const results = await this.store?.similaritySearchWithScore(
        query,
        topK,
        filterFn
      );

      return (
        results
          ?.map(([doc, score]) => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score,
          }))
          .filter((result) => !minScore || result.score >= minScore) || []
      );
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("search with filter", error);
    }
  }

  /**
   * Delete documents matching a metadata filter
   */
  async deleteByMetadata(metadata: Record<string, any>): Promise<void> {
    this.ensureInitialized();

    try {
      let query = this.client.from(this.tableName!).delete();

      for (const [key, value] of Object.entries(metadata)) {
        query = query.filter(`metadata->>${key}`, "eq", value);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      console.log(`✓ Deleted documents matching metadata filter`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("delete by metadata", error);
    }
  }

  /**
   * Delete all documents from the table
   */
  async clear(): Promise<void> {
    this.ensureInitialized();

    try {
      const { error } = await this.client
        .from(this.tableName!)
        .delete()
        .neq(this.idColumn, 0);

      if (error) {
        throw error;
      }

      console.log(`✓ Cleared all documents from ${this.tableName}`);
    } catch (error) {
      throw VectorStoreErrorHandler.handleError("clear store", error);
    }
  }

  /**
   * Save is a no-op for Supabase (auto-persisted)
   */
  async save(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Get statistics about the vector store
   */
  async getStats(): Promise<VectorStoreStats> {
    const baseStats = await super.getStats();

    try {
      const { count, error } = await this.client
        .from(this.tableName!)
        .select("*", { count: "exact", head: true });

      if (error) {
        return baseStats;
      }

      return {
        ...baseStats,
        // documentCount: count || 0,
        // supportsFullTextSearch: true,
      };
    } catch (error) {
      return baseStats;
    }
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    await super.close();
  }

  /**
   * Normalize documents to ensure metadata is JSON-serializable
   */
  protected normalizeDocuments(documents: Document[]): Document[] {
    return documents.map((doc) => ({
      ...doc,
      pageContent: doc.pageContent || "",
      metadata: doc.metadata ? JSON.parse(JSON.stringify(doc.metadata)) : {},
    }));
  }

  /**
   * Generate a unique key for deduplication in hybrid search
   */
  protected getResultKey(result: SearchResult | FullTextSearchResult): string {
    if (result.metadata[this.idColumn]) {
      return String(result.metadata[this.idColumn]);
    }

    const contentHash = result.content
      .substring(0, 200)
      .split("")
      .reduce((hash, char) => {
        return (hash << 5) - hash + char.charCodeAt(0);
      }, 0);

    return `hash_${contentHash}`;
  }

  /**
   * Generate setup SQL for UUID-based schema (recommended)
   */
  static getSetupSQL(
    tableName: string = "documents",
    embeddingDimension: number = 1536,
    useUUID: boolean = true
  ): string {
    const idColumn = useUUID
      ? `id uuid primary key default uuid_generate_v4()`
      : `id bigserial primary key`;

    const idType = useUUID ? "uuid" : "bigint";

    return `
-- Enable required extensions
create extension if not exists vector;
${useUUID ? 'create extension if not exists "uuid-ossp";' : ""}

-- Create documents table
create table if not exists ${tableName} (
  ${idColumn},
  content text,
  metadata jsonb,
  embedding vector(${embeddingDimension})
);

-- Vector similarity search function
create or replace function match_${tableName} (
  query_embedding vector(${embeddingDimension}),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id ${idType},
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (${tableName}.embedding <=> query_embedding) as similarity
  from ${tableName}
  where metadata @> filter
  order by ${tableName}.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Full-text search function
create or replace function kw_match_${tableName}(
  query_text text,
  match_count int
)
returns table (
  id ${idType},
  content text,
  metadata jsonb,
  similarity real
)
language plpgsql
as $$
begin
  return query
  select 
    ${tableName}.id,
    ${tableName}.content,
    ${tableName}.metadata,
    ts_rank(to_tsvector('english', ${tableName}.content), plainto_tsquery('english', query_text)) as similarity
  from ${tableName}
  where to_tsvector('english', ${tableName}.content) @@ plainto_tsquery('english', query_text)
  order by similarity desc
  limit match_count;
end;
$$;

-- Create indexes for performance
create index if not exists ${tableName}_embedding_idx on ${tableName} 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create index if not exists ${tableName}_content_idx on ${tableName}
using gin (to_tsvector('english', content));

-- Optional: Create index on metadata for faster filtering
create index if not exists ${tableName}_metadata_idx on ${tableName}
using gin (metadata);
    `.trim();
  }

  /**
   * Setup database with instructions
   */
  static async setupDatabase(
    supabaseUrl: string,
    supabaseKey: string,
    tableName: string = "documents",
    embeddingDimension: number = 1536,
    useUUID: boolean = true
  ): Promise<void> {
    const setupSQL = SupabaseVectorStore.getSetupSQL(
      tableName,
      embeddingDimension,
      useUUID
    );

    console.log(`
═══════════════════════════════════════════════════════════════
SUPABASE SETUP INSTRUCTIONS
═══════════════════════════════════════════════════════════════

Run this SQL in Supabase SQL Editor:
Dashboard → SQL Editor → New Query

${setupSQL}

═══════════════════════════════════════════════════════════════
    `);
  }
}
