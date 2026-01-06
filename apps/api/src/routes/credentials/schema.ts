import { coerce, z } from "zod";
import {
  CredentialSchema,
  createCredentialSchema,
  updateCredentialSchema,
} from "@gaia/db";

export const credentialSchemas = {
  // Input schemas
  createCredentialInput: createCredentialSchema,

  getCredentialsInput: z.object({
    limit: z.coerce
      .number()
      .optional()
      .default(20)
      .describe("Number of results per page"),
    offset: z.coerce
      .number()
      .optional()
      .default(0)
      .describe("Pagination offset"),
  }),

  getCredentialInput: z.object({
    id: z.string().describe("Credential ID"),
  }),

  updateCredentialInput: z.object({
    id: z.string().describe("Credential ID"),
    data: updateCredentialSchema,
  }),

  deleteCredentialInput: z.object({
    id: z.string().describe("Credential ID to delete"),
  }),

  deleteModelFromCredentialInput: z.object({
    id: z.string().describe("Credential ID"),
    modelName: z.string().describe("Model name to remove"),
  }),

  // Output schemas
  createCredentialOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    credentialId: z.string().optional(),
  }),

  getCredentialsOutput: z.object({
    success: z.boolean(),
    credentials: z.array(
      CredentialSchema.extend({
        maskedApiKey: z.string(),
      })
    ),
    nextOffset: z.number().optional(),
    hasMore: z.boolean(),
    total: z.number(),
    message: z.string().optional(),
  }),

  getCredentialOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    credential: z
      .object({
        id: z.string(),
        provider: z.string(),
        baseUrl: z.string().nullable(),
        models: z.array(z.string()).nullable(),
        isValid: z.boolean(),
        lastValidatedAt: z.date().nullable(),
        createdAt: z.date(),
        maskedApiKey: z.string(),
      })
      .optional(),
  }),

  updateCredentialOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  deleteCredentialOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  deleteModelFromCredentialOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
};
