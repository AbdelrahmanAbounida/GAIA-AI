import { z } from "zod";

export const continuousParamSchema = z.object({
  searchspace_type: z.literal("continuous"),
  bounds: z.tuple([z.number(), z.number()]),
  dtype: z.enum(["int", "float"]),
});

export const categoricalParamSchema = z.object({
  searchspace_type: z.literal("categorical"),
  choices: z.union([
    z.array(z.string()),
    z.record(
      z.string(),
      z.object({
        api_key: z.string().nullable().optional(),
        api_base: z.string().nullable().optional(),
        index_name: z.string().nullable().optional(),
        cloud_config: z.any().nullable().optional(),
        models: z.array(z.string()).optional(),
        pricing: z
          .object({
            storage_per_gb_month: z.number().optional(),
            read_operations_per_1k: z.number().optional(),
            write_operations_per_1k: z.number().optional(),
            query_per_1k: z.number().optional(),
          })
          .optional(),
      })
    ),
  ]),
});

export const booleanParamSchema = z.object({
  searchspace_type: z.literal("boolean"),
  allow_multiple: z.boolean().optional(),
});

export const optimizationConfigSchema = z.object({
  chunk_size: continuousParamSchema.optional(),
  max_tokens: continuousParamSchema.optional(),
  chunk_overlap: continuousParamSchema.optional(),
  temperature: continuousParamSchema.optional(),
  vector_store: categoricalParamSchema.optional(),
  search_type: categoricalParamSchema.optional(),
  use_reranker: booleanParamSchema.optional(),
  llm: categoricalParamSchema.optional(),
  embedding: categoricalParamSchema.optional(),
  k: continuousParamSchema.optional(),
});

export type OptimizationConfig = z.infer<typeof optimizationConfigSchema>;

export const formDataSchema = z.object({
  chunk_size_min: z.number().min(100).max(5000),
  chunk_size_max: z.number().min(100).max(5000),
  max_tokens_min: z.number().min(100).max(10000),
  max_tokens_max: z.number().min(100).max(10000),
  chunk_overlap_min: z.number().min(0).max(1000),
  chunk_overlap_max: z.number().min(0).max(1000),
  temperature_min: z.number().min(0).max(2),
  temperature_max: z.number().min(0).max(2),
  k_min: z.number().min(1).max(50),
  k_max: z.number().min(1).max(50),

  // Categorical parameters
  vector_stores: z.array(z.string()).min(1),
  search_types: z.array(z.string()).min(1),
  llm_providers: z.array(z.string()).min(1),
  llm_models: z.array(z.string()).min(1),
  embedding_providers: z.array(z.string()).min(1),
  embedding_models: z.array(z.string()).min(1),

  use_reranker: z.boolean(),
});

export type FormData = z.infer<typeof formDataSchema>;
