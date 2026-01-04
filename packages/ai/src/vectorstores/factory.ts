import { OpenAIEmbeddings } from "@langchain/openai";
import * as path from "path";
import type {
  VectorStoreProviderId,
  VectorStoreConfig,
  FullTextSearchProviderId,
} from "./types";
import { FaissVectorStore } from "./faiss";
import { LanceDBVectorStore } from "./lancedb";
import { PineconeVectorStore } from "./pinecone";
import { QdrantVectorStore } from "./qdrant";
import { WeaviateVectorStore } from "./weaviate";
import { ChromaVectorStore } from "./chroma";
import { MilvusVectorStore } from "./milvus";
import { PGVectorVectorStore } from "./pgvector";
import { SupabaseVectorStore } from "./supabase";
import type { BaseVectorStore } from "./base";

export interface CreateVectorStoreOptions {
  // Core options
  projectId: string;
  embeddingApiKey: string;
  embeddingModel?: string;
  embeddingBaseURL?: string;
  provider?: VectorStoreProviderId;
  tableName?: string;

  // RAG Settings
  chunkingMethod?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  searchType?: string;
  topK?: number;
  reranker?: string;
  useReranker?: boolean;
  providerConfig?: Record<string, any>;

  // Full-Text Search Settings
  fullTextSearchTool?: FullTextSearchProviderId;
  ftsConfig?: Record<string, any>;
}

/**
 * Factory function to create and initialize a vector store
 */
export async function createVectorStore({
  projectId,
  embeddingApiKey,
  embeddingModel = "text-embedding-3-small",
  embeddingBaseURL,
  provider = "lancedb",
  tableName,
  providerConfig,
  fullTextSearchTool,
  ftsConfig,
}: CreateVectorStoreOptions): Promise<BaseVectorStore> {
  const embeddings = new OpenAIEmbeddings({
    apiKey: embeddingApiKey,
    configuration: {
      baseURL: embeddingBaseURL,
    },
    model: embeddingModel,
  });

  const persistDirectory = path.join(
    process.cwd(),
    "data",
    "vector_stores",
    provider,
    projectId
  );

  // Determine FTS provider
  const effectiveFTSProvider = determineEffectiveFTSProvider(
    provider,
    fullTextSearchTool
  );

  const vectorStore = createVectorStoreInstance(provider, {
    persistDirectory,
    embeddings,
    provider,
    tableName,
    projectId,
    fullTextSearchTool: effectiveFTSProvider!,
    ftsConfig: ftsConfig || {},
    ...providerConfig,
  });

  await vectorStore.initialize();

  return vectorStore;
}

/**
 * Determine which FTS provider to use based on vector store and user selection
 */
function determineEffectiveFTSProvider(
  vectorStoreProvider: VectorStoreProviderId,
  userSelectedFTS?: FullTextSearchProviderId
): FullTextSearchProviderId | null {
  // Providers that support native FTS
  const nativeFTSProviders: VectorStoreProviderId[] = [
    "weaviate",
    "pgvector",
    "supabase",
  ];

  // If user explicitly selected an FTS provider, use it
  if (userSelectedFTS) {
    // If they selected 'native' but provider doesn't support it, fall back to flexsearch
    if (
      userSelectedFTS === "native" &&
      !nativeFTSProviders.includes(vectorStoreProvider)
    ) {
      console.warn(
        `${vectorStoreProvider} doesn't support native FTS. Falling back to flexsearch.`
      );
      return "flexsearch";
    }
    return userSelectedFTS;
  }

  // Default behavior: use native if available, otherwise don't use FTS
  if (nativeFTSProviders.includes(vectorStoreProvider)) {
    return "native";
  }

  return null;
}

export async function validateVectorstore({
  provider,
  config,
}: {
  provider: VectorStoreProviderId;
  config: Record<string, any>;
}): Promise<boolean | Error> {
  switch (provider) {
    case "faiss":
      return FaissVectorStore.validateApiKey(config);
    case "lancedb":
      return LanceDBVectorStore.validateApiKey(config);
    case "pinecone":
      return PineconeVectorStore.validateApiKey(config);
    case "qdrant":
      return QdrantVectorStore.validateApiKey(config);
    case "weaviate":
      return WeaviateVectorStore.validateApiKey(config);
    case "chroma":
      return ChromaVectorStore.validateApiKey(config);
    case "milvus":
      return MilvusVectorStore.validateApiKey(config);
    case "pgvector":
      return PGVectorVectorStore.validateApiKey(config);
    case "supabase":
      return SupabaseVectorStore.validateApiKey(config);
    default:
      throw new Error(`Unsupported vector store provider: ${provider}`);
  }
}

/**
 * Create a vector store instance based on provider
 */
export function createVectorStoreInstance(
  provider: VectorStoreProviderId,
  config: VectorStoreConfig
): BaseVectorStore {
  switch (provider) {
    case "faiss":
      return new FaissVectorStore(config);
    case "lancedb":
      return new LanceDBVectorStore(config);
    case "pinecone":
      return new PineconeVectorStore(config);
    case "qdrant":
      return new QdrantVectorStore(config);
    case "weaviate":
      return new WeaviateVectorStore(config);
    case "chroma":
      return new ChromaVectorStore(config);
    case "milvus":
      return new MilvusVectorStore(config);
    case "pgvector":
      return new PGVectorVectorStore(config);
    case "supabase":
      return new SupabaseVectorStore(config);
    default:
      throw new Error(`Unsupported vector store provider: ${provider}`);
  }
}

/**
 * Get available vector store providers
 */
export function getAvailableProviders(): VectorStoreProviderId[] {
  return [
    "faiss",
    "lancedb",
    "pinecone",
    "qdrant",
    "weaviate",
    "chroma",
    "milvus",
    "pgvector",
    "supabase",
  ];
}

/**
 * Check if a provider requires cloud credentials
 */
export function providerRequiresCredentials(
  provider: VectorStoreProviderId
): boolean {
  const cloudProviders: VectorStoreProviderId[] = [
    "pinecone",
    "qdrant",
    "weaviate",
    "milvus",
    "supabase",
  ];
  return cloudProviders.includes(provider);
}

/**
 * Check if a provider can run locally without credentials
 */
export function providerSupportsLocal(
  provider: VectorStoreProviderId
): boolean {
  const localProviders: VectorStoreProviderId[] = [
    "faiss",
    "lancedb",
    "qdrant",
    "weaviate",
    "chroma",
    "milvus",
    "pgvector",
  ];
  return localProviders.includes(provider);
}

/**
 * Get provider-specific configuration requirements
 */
export function getProviderConfig(provider: VectorStoreProviderId): {
  requiresDatabase?: boolean;
  supportsHybridSearch?: boolean;
  supportsFilters?: boolean;
  requiresSetup?: boolean;
  supportsNativeFTS?: boolean;
} {
  const configs: Record<VectorStoreProviderId, any> = {
    faiss: { supportsFilters: false },
    lancedb: { supportsFilters: true },
    pinecone: { supportsFilters: true },
    qdrant: { supportsFilters: true },
    weaviate: {
      supportsFilters: true,
      supportsHybridSearch: true,
      supportsNativeFTS: true,
    },
    chroma: { supportsFilters: true },
    milvus: { supportsFilters: true },
    pgvector: {
      requiresDatabase: true,
      supportsFilters: true,
      supportsHybridSearch: true,
      supportsNativeFTS: true,
    },
    supabase: {
      requiresDatabase: true,
      supportsFilters: true,
      requiresSetup: true,
      supportsNativeFTS: true,
    },
  };

  return configs[provider] || {};
}
