import { z } from "zod";
import { ApiKeySchema } from "@gaia/db";

export const apiKeySchemas = {
  // Input schemas
  createApiKeyInput: z.object({
    name: z.string().min(1).max(255).describe("API key name"),
    value: z.string().min(1).describe("API key value"),
    projectId: z.string().describe("Project ID this API key belongs to"),
    expiresAt: z.date().optional().describe("Optional expiration date"),
  }),

  deleteApiKeyInput: z.object({
    id: z.string().uuid().describe("API key ID to delete"),
  }),

  getApiKeyInput: z.object({
    id: z.string().uuid().describe("API key ID"),
  }),

  // Output schemas
  createApiKeyOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    apiKey: ApiKeySchema.optional(),
  }),

  deleteApiKeyOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  getApiKeysOutput: z.object({
    success: z.boolean(),
    apiKeys: z.array(ApiKeySchema),
  }),

  getApiKeyOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    apiKey: ApiKeySchema.optional(),
  }),
};
