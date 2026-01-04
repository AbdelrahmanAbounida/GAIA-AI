import yaml from "js-yaml";
import { optimizationConfigSchema, type OptimizationConfig } from "./schema";

export interface ParseResult {
  success: boolean;
  data?: OptimizationConfig;
  error?: string;
}

export function parseYamlConfig(yamlContent: string): ParseResult {
  try {
    const parsed = yaml.load(yamlContent);

    if (!parsed || typeof parsed !== "object") {
      return {
        success: false,
        error: "Invalid YAML: Expected an object",
      };
    }

    const validated = optimizationConfigSchema.safeParse(parsed);

    if (!validated.success) {
      return {
        success: false,
        error: `Validation error: ${validated.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    return {
      success: true,
      data: validated.data,
    };
  } catch (err) {
    return {
      success: false,
      error: `YAML parse error: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

export function configToFormData(config: OptimizationConfig) {
  return {
    chunk_size_min: config.chunk_size?.bounds[0] ?? 500,
    chunk_size_max: config.chunk_size?.bounds[1] ?? 1000,
    max_tokens_min: config.max_tokens?.bounds[0] ?? 1000,
    max_tokens_max: config.max_tokens?.bounds[1] ?? 5000,
    chunk_overlap_min: config.chunk_overlap?.bounds[0] ?? 100,
    chunk_overlap_max: config.chunk_overlap?.bounds[1] ?? 500,
    temperature_min: config.temperature?.bounds[0] ?? 0.1,
    temperature_max: config.temperature?.bounds[1] ?? 1.0,
    k_min: config.k?.bounds[0] ?? 3,
    k_max: config.k?.bounds[1] ?? 15,
    vector_stores: config.vector_store?.choices
      ? Array.isArray(config.vector_store.choices)
        ? config.vector_store.choices
        : Object.keys(config.vector_store.choices)
      : ["faiss"],
    search_types: config.search_type?.choices
      ? Array.isArray(config.search_type.choices)
        ? config.search_type.choices
        : []
      : ["similarity"],
    llm_providers: config.llm?.choices
      ? Object.keys(config.llm.choices as Record<string, unknown>)
      : ["openai"],
    llm_models: config.llm?.choices
      ? Object.values(
          config.llm.choices as Record<string, { models?: string[] }>
        ).flatMap((p) => p.models || [])
      : ["gpt-4o-mini"],
    embedding_providers: config.embedding?.choices
      ? Object.keys(config.embedding.choices as Record<string, unknown>)
      : ["openai"],
    embedding_models: config.embedding?.choices
      ? Object.values(
          config.embedding.choices as Record<string, { models?: string[] }>
        ).flatMap((p) => p.models || [])
      : ["text-embedding-3-small"],
    use_reranker: config.use_reranker?.allow_multiple ?? false,
  };
}
