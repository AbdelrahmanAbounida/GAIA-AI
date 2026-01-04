import type { Embeddings } from "@langchain/core/embeddings";
import type { Document } from "@langchain/core/documents";
import { VectorStore } from "@langchain/core/vectorstores";
import type { SearchType } from "./fulltext";

export type VectorStoreProviderId =
  | "faiss"
  | "chroma"
  | "pinecone"
  | "qdrant"
  | "weaviate"
  | "milvus"
  | "pgvector"
  | "lancedb"
  | "supabase";

export type FullTextSearchProviderId =
  | "flexsearch"
  | "minisearch"
  | "orama"
  | "native";

export interface VectorStoreConfig {
  persistDirectory: string;
  embeddings: Embeddings;
  provider: VectorStoreProviderId;
  tableName?: string;
  collection?: string;
  projectId?: string;

  // Full-Text Search Configuration
  fullTextSearchTool?: FullTextSearchProviderId | null;
  ftsConfig?: Record<string, any>;

  // Provider-specific config
  [key: string]: any;
}

export interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface SearchOptions {
  topK?: number;
  minScore?: number;
  filters?: Record<string, any>;
}

export interface FullTextSearchResult {
  id?: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface FullTextSearchOptions {
  topK?: number;
  minScore?: number;
  searchType?: "mrr" | "semantic" | "hybrid";
  filters?: Record<string, any>;
  boost?: Record<string, number>;
}

export interface HybridSearchOptions extends SearchOptions {
  alpha?: number; // Weight between vector (1) and text (0) search
}

export interface VectorStoreStats {
  provider: string;
  persistPath: string;
  tableName?: string;
  exists: boolean;
  supportsFullTextSearch: boolean;
}

export interface IVectorStore {
  initialize(): Promise<void>;
  addDocuments(documents: Document[], ids?: string[]): Promise<string[] | void>;
  addTexts(
    texts: string[],
    metadatas?: Record<string, any>[],
    ids?: string[]
  ): Promise<string[] | void>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  delete(ids: string[], documentId?: string): Promise<void>;
  save(): Promise<void>;
  getStats(): Promise<VectorStoreStats>;
  close(): Promise<void>;

  // Full-text search methods
  supportsFullTextSearch(): boolean;
  fullTextSearch(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]>;
  hybridSearch(
    query: string,
    options?: HybridSearchOptions
  ): Promise<FullTextSearchResult[]>;
}

export interface VectorStoreCredentials {
  id: string;
  name: string;
  isRequired: boolean;
  cloudOnly?: boolean;
  isSecret?: boolean;
  default?: string | number | boolean;
  placeholder?: string;
  description?: string;
}

export interface FullTextSearchRequirement {
  requiresSetup?: boolean;
  setupInstructions?: string;
  setupDocUrl?: string;

  configFields?: {
    id: string;
    name: string;
    description?: string;
    isRequired: boolean;
    default?: any;
    placeholder?: string;
  }[];

  searchType: "native" | "external";
  nativeAlgorithm?: "bm25" | "tfidf" | "hybrid";
}

export interface VectorStoreProvider {
  id: VectorStoreProviderId;
  name: string;
  description: string;
  credentials: VectorStoreCredentials[];
  isLocalOnly?: boolean;
  needsCredentials?: boolean;
  apiKeyDocs?: string;
  supportsFullTextSearch?: boolean;
  fullTextSearchConfig?: FullTextSearchRequirement;
}
export interface FullTextSearchTool {
  id: FullTextSearchProviderId;
  name: string;
  description: string;
  bestFor: string;
  maxDocuments?: number; // Performance guideline
}
// TODO:: extend it for different providers options to make it global

export interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface SearchOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, any>; // Added filter support
}

export interface FullTextSearchOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, any>;
  alpha?: number; // For hybrid search weighting (0 = pure text, 1 = pure vector)
}

//  Full-text search result
export interface FullTextSearchResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
  searchType: SearchType;
}

export interface HybridSearchOptions {
  topK?: number;
  minScore?: number;
  alpha?: number;
  filter?: Record<string, any>;
}
