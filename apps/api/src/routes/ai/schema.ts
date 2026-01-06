import { z } from "zod";
import { gatewayLanguageModelEntrySchema } from "@gaia/ai";
import { VectorStoreSchema } from "@gaia/ai/models";
import { CredentialSchema } from "@gaia/db";

const OpenAIMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
  name: z.string().optional(),
});

const AISdkMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
  experimental_attachments: z.array(z.any()).optional(),
});

export const aiSchemas = {
  // Input schemas
  chatCompletionsInput: z.object({
    chatId: z.string().describe("The chat session identifier"),
    messages: z.array(OpenAIMessageSchema).describe("Conversation messages"),
    model: z.string().default("gpt-4o").describe("Model identifier"),
    provider: z.string().optional().describe("Provider name"),
    temperature: z.number().optional().default(0.7).describe("Temperature"),
    max_tokens: z.number().optional().describe("Maximum tokens"),
    stream: z.boolean().optional().default(false).describe("Stream response"),
  }),

  streamChatInput: z.object({
    chatId: z.string().describe("The chat session identifier"),
    messages: z.array(AISdkMessageSchema).describe("Conversation messages"),
    model: z.string().optional().default("gpt-4o").describe("Model identifier"),
    provider: z.string().optional().describe("Provider name"),
    system: z.string().optional().describe("System prompt"),
  }),

  imageGenerationInput: z.object({
    prompt: z.string().describe("Image generation prompt"),
    model: z
      .string()
      .optional()
      .default("google/gemini-2.5-flash-image")
      .describe("Model identifier"),
    provider: z.string().optional().describe("Provider name"),
    n: z.number().optional().default(1).describe("Number of images"),
    stream: z.boolean().optional().default(false).describe("Stream response"),
  }),

  // Output schemas
  getAllProvidersOutput: z.object({
    success: z.boolean(),
    modelsProviders: z.array(
      z.object({
        name: z.string(),
        capabilities: z.array(z.enum(["embedding", "language", "image"])),
        models: z.array(gatewayLanguageModelEntrySchema),
      })
    ),
    vectorstoresProviders: z.array(VectorStoreSchema).optional(),
  }),

  getAllModelsOutput: z.object({
    success: z.boolean(),
    models: z
      .object({
        llms: z.array(gatewayLanguageModelEntrySchema),
        embeddings: z.array(gatewayLanguageModelEntrySchema),
        image: z.array(gatewayLanguageModelEntrySchema),
      })
      .optional(),
    vectorstores: z.array(VectorStoreSchema).optional(),
    message: z.string().optional(),
  }),

  getUserModelsOutput: z.object({
    success: z.boolean(),
    ai_models: z.array(CredentialSchema).optional(),
    embeddings: z.array(CredentialSchema).optional(),
    message: z.string().optional(),
  }),

  imageGenerationOutput: z.any(),
};
