import { z } from "zod";
import {
  createRagDocumentSchema,
  RagDocumentSchema,
  RAGSettingsSchema,
} from "@gaia/db";

const IndexingEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("progress"),
    progress: z.number().min(0).max(100),
    message: z.string(),
    currentChunk: z.number().optional(),
    totalChunks: z.number().optional(),
  }),
  z.object({
    type: z.literal("completed"),
    documentId: z.string(),
    message: z.string(),
    totalChunks: z.number(),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
    error: z.string().optional(),
  }),
  z.object({
    type: z.literal("paused"),
    message: z.string(),
    currentChunk: z.number(),
  }),
  z.object({
    type: z.literal("cancelled"),
    message: z.string(),
  }),
]);

export const ragSchemas = {
  // Input schemas
  createAndIndexDocumentInput: createRagDocumentSchema.extend({
    projectId: z.string(),
    fileId: z.string().optional(),
  }),

  getRagDocumentsInput: z.object({
    projectId: z.string(),
    status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
  }),

  getRagDocumentInput: z.object({
    id: z.string().describe("Document ID"),
  }),

  deleteRagDocumentInput: z.object({
    id: z.string().describe("Document ID to delete"),
  }),

  validateVectorstoreConfigInput: z.object({
    vectorstoreProvider: z.string().describe("Vector store provider"),
    vectorStoreConfig: z
      .record(z.string(), z.any())
      .describe("Vector store configuration"),
  }),

  searchDocumentsInput: z.object({
    query: z.string().describe("Search query"),
    projectId: z.string().describe("Project ID"),
    topK: z
      .number()
      .default(5)
      .optional()
      .describe("Number of results to return"),
    minScore: z
      .number()
      .default(0.5)
      .optional()
      .describe("Minimum score threshold"),
    searchType: z
      .enum(["semantic", "mrr", "hybrid"])
      .optional()
      .describe("Search type"),
    alpha: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe("Alpha value for hybrid search"),
  }),

  getRAGSettingsInput: z.object({
    projectId: z.string().describe("Project ID"),
  }),

  updateRAGSettingsInput: z.object({
    projectId: z.string().describe("Project ID"),
    settings: RAGSettingsSchema,
  }),

  // Output schemas
  createAndIndexDocumentOutput: z.object({
    status: z.enum(["processing", "completed", "failed"]),
    message: z.string(),
    documentId: z.string().optional(),
  }),

  createAndIndexDocumentStreamingOutput: IndexingEventSchema,

  getRagDocumentsOutput: z.object({
    success: z.boolean(),
    documents: z.array(RagDocumentSchema),
    total: z.number(),
    hasMore: z.boolean(),
    nextOffset: z.number().optional(),
    message: z.string().optional(),
  }),

  getRagDocumentOutput: z.object({
    success: z.boolean(),
    document: RagDocumentSchema.nullable(),
    message: z.string().optional(),
  }),

  deleteRagDocumentOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
  }),

  validateVectorstoreConfigOutput: z.object({
    isValid: z.boolean(),
    message: z.string(),
  }),

  searchDocumentsOutput: z.object({
    success: z.boolean(),
    documents: z.array(
      z.object({
        content: z.string(),
        metadata: z.record(z.string(), z.any()),
        score: z.number(),
      })
    ),
    message: z.string().optional(),
  }),

  getRAGSettingsOutput: z.object({
    success: z.boolean(),
    settings: RAGSettingsSchema.nullable(),
    message: z.string().optional(),
  }),

  updateRAGSettingsOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
  }),
};
