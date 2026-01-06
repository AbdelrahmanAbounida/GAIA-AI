import type { Credential, Project, RAGSettings } from "@gaia/db";
import { decryptApiKey } from "./utils";

/**
 * Helper: Extract credentials from user's credential list
 */
export function extractCredentials(
  userCredentials: Credential[],
  project: Project
) {
  let embeddingCred = userCredentials
    .filter((c) => c.credentialType === "ai_model")
    .find((c) => {
      const caps = Array.isArray(c.capabilities) ? c.capabilities : [];

      // For gateway providers (vercel), assume they support all capabilities
      const isGateway = ["vercel", "openrouter"].includes(
        c.provider?.toLowerCase() || ""
      );
      const hasEmbeddingCap = caps.includes("embedding") || isGateway;

      return (
        hasEmbeddingCap && project.embeddingProvider?.includes(c.provider!)
      );
    });

  if (!embeddingCred) {
    // fallback to any embedding credential or gateway
    embeddingCred = userCredentials
      .filter((c) => c.credentialType === "ai_model")
      .find((c) => {
        const caps = Array.isArray(c.capabilities) ? c.capabilities : [];
        const isGateway = ["vercel", "openrouter"].includes(
          c.provider?.toLowerCase() || ""
        );
        return caps.includes("embedding") || isGateway;
      });
  }

  let vectorStoreCred = userCredentials.find(
    (c) =>
      c.credentialType === "vectorstore" &&
      project.vectorStore?.includes(c.provider!)
  );

  if (!vectorStoreCred) {
    vectorStoreCred = {
      credentialType: "vectorstore",
      provider: "lancedb",
      apiKey: "",
    } as Credential;
  }

  return {
    embedding: embeddingCred
      ? {
          apiKey: decryptApiKey(embeddingCred.apiKey),
          baseURL: embeddingCred.baseUrl || undefined,
        }
      : null,
    vectorStore: vectorStoreCred
      ? {
          apiKey: decryptApiKey(vectorStoreCred.apiKey),
          config: JSON.parse((vectorStoreCred.dynamicFields as string) || "{}"),
        }
      : null,
  };
}

/**
 * Parse a model string like "provider/model-name" into parts.
 */
export function parseLLMModel(modelString: string): {
  provider: string | null;
  model: string;
} {
  if (!modelString) return { provider: null, model: "" };
  if (modelString.includes("/")) {
    const [provider, ...modelParts] = modelString.split("/");
    return {
      provider: provider || null,
      model: modelParts.join("/"),
    };
  }
  return {
    provider: null,
    model: modelString,
  };
}

/**
 * Build a full RAGSettings object from DB settings + credentials.
 * Keeps defaults safe and doesn't mutate inputs.
 */
export function buildRAGSettings(
  projectRow: Partial<Project>,
  credentials: Credential
): RAGSettings {
  // Defaults and safe access
  const vectorStore = projectRow.vectorStore || "faiss";
  const vectorStoreConfig = (projectRow.vectorStoreConfig as any) || {};
  const embeddingModel = projectRow.embeddingModel || "";
  const embeddingProvider = projectRow.embeddingProvider || "";

  // If embedding model contains provider (provider/model), prefer that
  const parsedEmbedding = embeddingModel.includes("/")
    ? parseLLMModel(embeddingModel)
    : { provider: embeddingProvider || null, model: embeddingModel };

  return {
    // LLM settings (may be empty / set by project)
    llmProvider: projectRow.llmProvider || undefined,
    llmModel: projectRow.llmModel || undefined,
    llmConfig: projectRow.llmConfig || undefined,

    // Embeddings
    embeddingProvider: parsedEmbedding.provider || undefined,
    embeddingModel: parsedEmbedding.model || undefined,
    embeddingDimensions: projectRow.embeddingDimensions || 1536,
    embeddingBatchSize: 100, // dbSettings.embeddingBatchSize ||

    // Vector store
    vectorStore,
    vectorStoreConfig: {
      provider: vectorStore,
      indexName: vectorStoreConfig.indexName || "default",
      namespace: vectorStoreConfig.namespace,
      metric: vectorStoreConfig.metric || "cosine",
      pinecone: credentials?.apiKey
        ? { apiKey: credentials.apiKey }
        : undefined,
      faiss:
        vectorStore === "faiss"
          ? { directory: vectorStoreConfig.directory || "./faiss-index" }
          : undefined,
      ...vectorStoreConfig,
    },

    // Search / retrieval defaults
    searchType: projectRow.searchType || "hybrid",
    topK: projectRow.topK ?? 5,
    useReranker: !!projectRow.useReranker,
    reranker: projectRow.reranker,

    // Chunking defaults
    chunkingMethod: projectRow.chunkingMethod || "paragraph",
    chunkSize: projectRow.chunkSize || 1000,
    chunkOverlap: projectRow.chunkOverlap || 200,
  } as RAGSettings;
}

/**
 * Return list of credentials required by RAG settings
 */
export function getRequiredCredentials(
  settings: Partial<RAGSettings>
): Array<{ type: "vectorstore" | "ai_model"; provider: string }> {
  const required: Array<{
    type: "vectorstore" | "ai_model";
    provider: string;
  }> = [];

  // Embedding model (ai_model)
  if (settings.embeddingModel || settings.embeddingProvider) {
    const parsed = settings.embeddingModel
      ? parseLLMModel(settings.embeddingModel)
      : { provider: settings.embeddingProvider || "openai", model: "" };
    required.push({
      type: "ai_model",
      provider: parsed.provider || settings.embeddingProvider || "openai",
    });
  }

  // Vector store credential (unless faiss/local)
  if (settings.vectorStore && settings.vectorStore !== "faiss") {
    required.push({
      type: "vectorstore",
      provider: settings.vectorStore,
    });
  }

  // LLM provider (for generation/rerank)
  if (settings.llmProvider || settings.llmModel) {
    const parsed = settings.llmModel
      ? parseLLMModel(settings.llmModel)
      : { provider: settings.llmProvider || "openai", model: "" };
    required.push({
      type: "ai_model",
      provider: parsed.provider || settings.llmProvider || "openai",
    });
  }

  return required;
}

/**
 * Check available credentials vs required credentials.
 * credential.credentialType values expected: "vectorstore" | "ai_model"
 */
export function validateCredentials(
  settings: Partial<RAGSettings>,
  availableCredentials: Credential[]
): { valid: boolean; missing: string[] } {
  const required = getRequiredCredentials(settings);
  const missing: string[] = [];

  for (const req of required) {
    const found = availableCredentials.some(
      (cred) =>
        cred.credentialType === req.type && cred.provider === req.provider
    );
    if (!found) missing.push(`${req.type}:${req.provider}`);
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extract RAG settings from a Project DB row
 */
export function extractRAGSettings(projectRow: Project): RAGSettings {
  return {
    llmProvider: projectRow.llmProvider,
    llmModel: projectRow.llmModel,
    llmConfig: projectRow.llmConfig || undefined,

    embeddingProvider: projectRow.embeddingProvider,
    embeddingModel: projectRow.embeddingModel,
    embeddingDimensions: projectRow.embeddingDimensions || 1536,

    vectorStore: projectRow.vectorStore || "faiss",
    vectorStoreConfig: projectRow.vectorStoreConfig || ({} as any),

    searchType: projectRow.searchType || "hybrid",
    topK: projectRow.topK || 5,

    reranker: projectRow.reranker,
    useReranker: !!projectRow.useReranker,

    // chunking defaults if project has them
    chunkingMethod: (projectRow as any).chunkingMethod || "paragraph",
    chunkSize: (projectRow as any).chunkSize || 1000,
    chunkOverlap: (projectRow as any).chunkOverlap || 200,
  } as RAGSettings;
}

/**
 * Helper: Validate required credentials
 */
export function validateRequiredCredentials(
  settings: any,
  credentials: ReturnType<typeof extractCredentials>
) {
  // TODO;: handle the validation
  // TODO:: if model is from ollama no need for api key
  const missing: string[] = [];

  if (settings.embeddingProvider && !credentials.embedding?.apiKey) {
    missing.push("Embedding Model API Key");
  }

  if (
    settings.vectorStore &&
    settings.vectorStore?.needsCredentials &&
    !credentials.vectorStore?.apiKey
  ) {
    missing.push("Vector Store API Key");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
