import { createGateway } from "@ai-sdk/gateway";
import dotenv from "dotenv";
import z from "zod";
import type { AIProvider as Provider, ProviderCapability } from "./types";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

dotenv.config();

// TODO;: move to api like feedback too
export const aiGateway = createGateway({
  apiKey:
    process.env.AI_GATEWAY_API_KEY ||
    "vck_2Z7c547Js4eb8e4sj8b1AYRsJQyTamv1BgRNyPVBhBMBRdk2Aj0ipmyJ",
});

export const aiCompatible = createOpenAICompatible({
  name: "openai",
  apiKey: "vck_2Z7c547Js4eb8e4sj8b1AYRsJQyTamv1BgRNyPVBhBMBRdk2Aj0ipmyJ",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

export const getAllProvidersWithModels = async (): Promise<Provider[]> => {
  const models = await aiGateway.getAvailableModels();
  const providerMap = new Map<string, Provider>();

  models.models.forEach((model) => {
    const providerName = model.id?.split("/")[0];
    if (!providerName) return;

    // Get or create provider entry
    if (!providerMap.has(providerName)) {
      providerMap.set(providerName, {
        name: providerName,
        capabilities: [],
        models: [],
      });
    }

    const provider = providerMap.get(providerName)!;
    if (
      model.modelType &&
      !provider.capabilities.includes(model.modelType as ProviderCapability)
    ) {
      provider.capabilities.push(model.modelType as ProviderCapability);
    }
    provider.models.push(model);
  });

  return Array.from(providerMap.values());
};

type ValidationOptions = {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
  provider?: string;
};

/**
 * Validates API credentials by attempting multiple validation strategies
 */
export async function validateApiKey({
  baseUrl,
  apiKey,
  timeoutMs = 10000,
  extraHeaders = {},
}: ValidationOptions): Promise<boolean> {
  if (!baseUrl || !apiKey) return false;

  const normalizedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const endpoints = [
      `${normalizedUrl}/chat/completions`,
      `${normalizedUrl}/chat/completions`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...extraHeaders,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "say ok" }],
            max_tokens: 1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (
          response.ok ||
          (response.status !== 401 && response.status !== 403)
        ) {
          const data = await response.json().catch(() => ({}));

          // Check if it's a model error (means auth worked)
          if (data.error && data.error.type === "invalid_request_error") {
            return true;
          }

          if (response.ok) {
            return true;
          }
        }

        if (response.status === 401 || response.status === 403) {
          continue;
        }
      } catch (error) {
        continue;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

export const VectorStoreSchema = z.object({
  id: z.enum([
    "faiss",
    "pinecone",
    "qdrant",
    "chroma",
    "weaviate",
    "milvus",
    "pgvector",
    "lancedb",
    "supabase",
  ]),
  isLocalOnly: z.boolean().optional(),
  name: z.string(),
  description: z.string(),
  credentials: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isRequired: z.boolean(),
      cloudOnly: z.boolean().optional(),
      isSecret: z.boolean().optional(),
    })
  ),
  needsCredentials: z.boolean().default(true),

  fullTextSearchConfig: z
    .object({
      requiresSetup: z.boolean().optional(),
      setupInstructions: z.string().optional(),
      setupDocUrl: z.string().optional(),

      configFields: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().optional(),
            isRequired: z.boolean(),
            default: z.any().optional(),
            placeholder: z.string().optional(),
          })
        )
        .optional(),

      searchType: z.enum(["native", "external"]),
      nativeAlgorithm: z.enum(["bm25", "tfidf", "hybrid"]).optional(),
    })
    .optional(),
});

// export const VectorStoreSchema = z.object({
//   id: z.enum([
//     "faiss",
//     "pinecone",
//     "qdrant",
//     "chroma",
//     "weaviate",
//     "milvus",
//     "pgvector",
//     "lancedb",
//     "supabase",
//   ]),
//   // type: z.enum(["local", "cloud"]),
//   isLocalOnly: z.boolean().optional(),
//   name: z.string(),
//   description: z.string(),
//   credentials: z.array(
//     z.object({
//       id: z.string(),
//       name: z.string(),
//       isRequired: z.boolean(),
//       cloudOnly: z.boolean().optional(),
//       isSecret: z.boolean().optional(),
//     })
//   ),
//   needsCredentials: z.boolean().default(true),
//   fullTextSearchConfig: z
//     .object({
//       requiresSetup: z.boolean().optional(),
//       setupInstructions: z.string().optional(),
//       setupDocUrl: z.string().optional(),
//       configFields: z
//         .array(
//           z
//             .object({
//               id: z.string(),
//               name: z.string(),
//               description: z.string().optional(),
//               isRequired: z.boolean(),
//               default: z.any().optional(),
//               placeholder: z.string().optional(),
//             })
//             .optional()
//         )
//         .optional(),
//       searchType: z.enum(["native", "external"]),
//       nativeAlgorithm: z.enum(["bm25", "tfidf", "hybrid"]).optional(),
//     })
//     .optional(),
// });

export * from "./const";
