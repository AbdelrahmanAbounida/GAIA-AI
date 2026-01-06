import { z } from "zod";
import { OllamaModelSchema } from "@gaia/ai/local";

const CategorySchema = z.enum([
  "embedding",
  "cloud",
  "vision",
  "tools",
  "thinking",
]);
const SortOrderSchema = z.enum(["newest", "popular"]);

export const ollamaSchemas = {
  // Get model details
  getModelDetailsInput: z.object({
    name: z.string().min(1, "Model name is required"),
    verbose: z.boolean().optional(),
  }),

  getModelDetailsOutput: z.object({
    success: z.boolean(),
    model: z
      .object({
        name: z.string().optional(),
        summary: z.string().optional(),
        downloads: z.string().optional(),
        tags: z.array(z.string()),
        lastUpdated: z.string(),
        sizes: z.array(z.string()),
        variants: z.array(z.any()),
        readme: z.string().optional(),
        command: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    error: z.string().optional(),
  }),

  // Search
  searchOllamaInput: z.object({
    query: z.string().default(""),
    categories: z.array(CategorySchema).optional().default([]),
    order: SortOrderSchema.optional().default("newest"),
  }),

  searchOllamaOutput: z.object({
    success: z.boolean(),
    models: z.array(OllamaModelSchema).optional(),
    error: z.string().optional(),
  }),

  // Pull model
  pullModelInput: z.object({
    modelName: z.string().min(1, "Model name is required"),
    baseUrl: z.string().url().optional(),
  }),

  pullModelOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
  }),

  // Pull status
  pullStatusInput: z.object({
    modelName: z.string().min(1, "Model name is required"),
    baseUrl: z.string().url().optional(),
  }),

  pullStatusOutput: z.object({
    success: z.boolean(),
    status: z
      .object({
        status: z.enum(["pulling", "extracting", "complete", "error"]),
        progress: z.number(),
        digest: z.string().optional(),
        total: z.number().optional(),
        completed: z.number().optional(),
      })
      .optional(),
    error: z.string().optional(),
  }),

  // List models
  listModelsInput: z.object({
    baseUrl: z.string().url().optional(),
  }),

  listModelsOutput: z.object({
    success: z.boolean(),
    models: z
      .array(
        z.object({
          name: z.string(),
          size: z.number(),
          digest: z.string(),
          modified_at: z.string(),
        })
      )
      .optional(),
    error: z.string().optional(),
  }),

  // Delete model
  deleteModelInput: z.object({
    modelName: z.string().min(1, "Model name is required"),
    baseUrl: z.string().url().optional(),
  }),

  deleteModelOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
  }),

  // Check connection
  checkConnectionInput: z.object({
    baseUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
  }),

  checkConnectionOutput: z.object({
    success: z.boolean(),
    connected: z.boolean().optional(),
    version: z.string().optional(),
    error: z.string().optional(),
  }),

  // Show model
  showModelInput: z.object({
    modelName: z.string().min(1, "Model name is required"),
    verbose: z.boolean().optional().default(false),
    baseUrl: z.string().url().optional(),
  }),

  showModelOutput: z.object({
    success: z.boolean(),
    capabilities: z.array(z.string()).optional(),
    details: z
      .object({
        parent_model: z.string().optional(),
        format: z.string().optional(),
        family: z.string().optional(),
        families: z.array(z.string()).optional(),
        parameter_size: z.string().optional(),
        quantization_level: z.string().optional(),
      })
      .optional(),
    error: z.string().optional(),
  }),
};
