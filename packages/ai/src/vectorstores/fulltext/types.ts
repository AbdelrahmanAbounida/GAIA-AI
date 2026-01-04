import type { FullTextSearchProviderId } from "../types";
import { Document } from "@langchain/core/documents";
export type SearchType = "mrr" | "semantic" | "hybrid";

export interface FullTextSearchConfig {
  persistDirectory: string;
  provider: FullTextSearchProviderId;
  indexName?: string;
  language?: string;
  ftsConfig?: Record<string, any>;
}

export interface FullTextSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface FullTextSearchOptions {
  topK?: number;
  minScore?: number;
  searchType?: SearchType;
  filters?: Record<string, any>;
  boost?: Record<string, number>;
}

export interface FullTextSearchStats {
  provider: string;
  persistPath: string;
  indexName: string;
  documentCount: number;
  exists: boolean;
}

export interface IFullTextSearch {
  initialize(): Promise<void>;
  addDocuments(documents: Document[], ids?: string[]): Promise<string[]>;
  addTexts(
    texts: string[],
    metadatas?: Record<string, any>[],
    ids?: string[]
  ): Promise<string[]>;
  search(
    query: string,
    options?: FullTextSearchOptions
  ): Promise<FullTextSearchResult[]>;
  delete(ids: string[]): Promise<void>;
  clear(): Promise<void>;
  save(): Promise<void>;
  getStats(): Promise<FullTextSearchStats>;
  close(): Promise<void>;
}
