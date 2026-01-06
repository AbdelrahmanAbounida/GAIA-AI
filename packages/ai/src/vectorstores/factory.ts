import { OpenAIEmbeddings } from "@langchain/openai";
import * as path from "path";
import * as fs from "fs/promises";
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
 * Get the base data directory, supporting both Docker and local environments
 */
function getDataDirectory(): string {
  // 1. Check for explicit VECTOR_STORE_PATH environment variable first
  if (process.env.VECTOR_STORE_PATH) {
    console.log(`📁 Using VECTOR_STORE_PATH: ${process.env.VECTOR_STORE_PATH}`);
    return process.env.VECTOR_STORE_PATH;
  }

  // 2. In Docker/production, use /app/data
  // Check multiple indicators of Docker/production environment
  const isDocker =
    process.env.NODE_ENV === "production" ||
    process.env.DATABASE_URL?.includes("/app/data") ||
    process.env.DATABASE_URL?.startsWith("file:/app/data") ||
    // Additional check: if we're in /app directory structure (Docker)
    process.cwd().startsWith("/app/");

  if (isDocker) {
    console.log("📁 Detected Docker/production environment, using /app/data");
    return "/app/data";
  }

  // 3. Default to process.cwd()/data for local development
  const localPath = path.join(process.cwd(), "data");
  console.log(`📁 Using local development path: ${localPath}`);
  return localPath;
}

/**
 * Ensure directory exists with proper permissions
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
    console.log(`✅ Directory created/verified: ${dirPath}`);
  } catch (error: any) {
    if (error.code !== "EEXIST") {
      throw new Error(
        `Failed to create directory ${dirPath}: ${error.message}\n` +
          `This might be a permission issue. Ensure the user running the process has write access.\n` +
          `Current user: ${process.getuid?.() || "unknown"}, path: ${dirPath}`
      );
    }
  }

  // Verify we can write to the directory
  try {
    const testFile = path.join(dirPath, ".write-test");
    await fs.writeFile(testFile, "test");
    await fs.unlink(testFile);
    console.log(`✅ Write permission verified for: ${dirPath}`);
  } catch (error: any) {
    throw new Error(
      `Directory ${dirPath} exists but is not writable: ${error.message}\n` +
        `Check permissions: chmod -R 755 ${dirPath} or chown to the correct user.\n` +
        `Current user: ${process.getuid?.() || "unknown"}, ` +
        `Current working directory: ${process.cwd()}`
    );
  }
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
  console.log("🔍 Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    VECTOR_STORE_PATH: process.env.VECTOR_STORE_PATH,
    cwd: process.cwd(),
  });

  const embeddings = new OpenAIEmbeddings({
    apiKey: embeddingApiKey,
    configuration: {
      baseURL: embeddingBaseURL,
    },
    model: embeddingModel,
  });

  // ✅ Use centralized data directory function
  const baseDataDir = getDataDirectory();

  // ✅ Create flat structure: /app/data/vector_stores/{provider}/{project-id}
  const persistDirectory = path.join(
    baseDataDir,
    "vector_stores",
    provider,
    projectId
  );

  console.log(`📁 Vector store will be created at: ${persistDirectory}`);

  await ensureDirectory(persistDirectory);

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
