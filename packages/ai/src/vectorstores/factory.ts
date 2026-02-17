import { OpenAIEmbeddings } from "@langchain/openai";
import * as path from "path";
import * as fs from "fs/promises";
import type {
  VectorStoreProviderId,
  VectorStoreConfig,
  FullTextSearchProviderId,
} from "./types";
import type { BaseVectorStore } from "./base";
import {
  loadProviderModule,
  INCLUDED_PROVIDERS,
} from "./_providers.generated";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

const VERCEL_UNSUPPORTED: VectorStoreProviderId[] = [
  "faiss",
  "chroma",
];

async function loadVectorStoreClass(provider: VectorStoreProviderId) {
  if (isVercel && VERCEL_UNSUPPORTED.includes(provider)) {
    throw new Error(
      `${provider} is not available on Vercel. Use Pinecone, Qdrant, or Supabase instead.`,
    );
  }

  const VectorStoreClass = await loadProviderModule(provider);
  if (!VectorStoreClass) {
    throw new Error(
      `Vector store provider "${provider}" is not included in this build. ` +
        `Included providers: ${INCLUDED_PROVIDERS.join(", ")}`,
    );
  }

  return VectorStoreClass;
}

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
    return process.env.VECTOR_STORE_PATH;
  }

  // 2. In Docker/production, use /app/data
  const isDocker =
    process.env.NODE_ENV === "production" ||
    process.env.DATABASE_URL?.includes("/app/data") ||
    process.env.DATABASE_URL?.startsWith("file:/app/data") ||
    process.cwd().startsWith("/app/");

  if (isDocker) {
    return "/app/data";
  }

  // 3. Default to process.cwd()/data for local development
  const localPath = path.join(process.cwd(), "data");
  return localPath;
}

/**
 * Ensure directory exists with proper permissions
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
  } catch (error: any) {
    if (error.code !== "EEXIST") {
      throw new Error(
        `Failed to create directory ${dirPath}: ${error.message}\n` +
          `This might be a permission issue. Ensure the user running the process has write access.\n` +
          `Current user: ${process.getuid?.() || "unknown"}, path: ${dirPath}`,
      );
    }
  }

  // Verify we can write to the directory
  try {
    const testFile = path.join(dirPath, ".write-test");
    await fs.writeFile(testFile, "test");
    await fs.unlink(testFile);
  } catch (error: any) {
    throw new Error(
      `Directory ${dirPath} exists but is not writable: ${error.message}\n` +
        `Check permissions: chmod -R 755 ${dirPath} or chown to the correct user.\n` +
        `Current user: ${process.getuid?.() || "unknown"}, ` +
        `Current working directory: ${process.cwd()}`,
    );
  }
}

/**
 * Get effective provider (with fallback logic for unavailable providers)
 */
function getEffectiveProvider(
  requestedProvider: VectorStoreProviderId,
): VectorStoreProviderId {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

  if (isVercel) {
    const unsupportedProviders: VectorStoreProviderId[] = [
      "faiss",
      "chroma",
    ];
    if (unsupportedProviders.includes(requestedProvider)) {
      throw new Error(
        `${requestedProvider} is not supported on Vercel. ` +
          `Please use a cloud-based vector store like Pinecone, Qdrant, LanceDB Cloud, or Supabase. ` +
          `Set your VECTOR_STORE_PROVIDER environment variable accordingly.`,
      );
    }
  }

  return requestedProvider;
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

  const effectiveProvider = getEffectiveProvider(provider);
  const baseDataDir = getDataDirectory();
  const persistDirectory = path.join(
    baseDataDir,
    "vector_stores",
    effectiveProvider,
    projectId,
  );

  if (!isVercel) {
    await ensureDirectory(persistDirectory);
  }

  // Determine FTS provider
  const effectiveFTSProvider = determineEffectiveFTSProvider(
    effectiveProvider,
    fullTextSearchTool,
  );

  const vectorStore = await createVectorStoreInstance(effectiveProvider, {
    persistDirectory,
    embeddings,
    provider: effectiveProvider,
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
  userSelectedFTS?: FullTextSearchProviderId,
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
        `${vectorStoreProvider} doesn't support native FTS. Falling back to flexsearch.`,
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
  const VectorStoreClass = await loadVectorStoreClass(provider);
  return VectorStoreClass.validateApiKey(config);
}

/**
 * Create a vector store instance based on provider (async now)
 */
export async function createVectorStoreInstance(
  provider: VectorStoreProviderId,
  config: VectorStoreConfig,
): Promise<BaseVectorStore> {
  const VectorStoreClass = await loadVectorStoreClass(provider);
  return new VectorStoreClass(config);
}

/**
 * Get available vector store providers (checks runtime availability)
 */
export async function getAvailableProviders(): Promise<
  VectorStoreProviderId[]
> {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

  if (isVercel) {
    return INCLUDED_PROVIDERS.filter(
      (p) => !VERCEL_UNSUPPORTED.includes(p),
    );
  }

  return [...INCLUDED_PROVIDERS];
}

/**
 * Check if a provider requires cloud credentials
 */
export function providerRequiresCredentials(
  provider: VectorStoreProviderId,
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
  provider: VectorStoreProviderId,
): boolean {
  const localProviders: VectorStoreProviderId[] = [
    "faiss",
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
