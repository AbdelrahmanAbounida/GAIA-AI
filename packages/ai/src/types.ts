import { z } from "zod";
import type { InferUITool, UIMessage } from "ai";
import type { GatewayLanguageModelSpecification } from "@ai-sdk/gateway";
import { createCodeArtifact } from "./tools/create-artifact";
import type { MessageMetadata, CustomUIDataTypes } from "./tools/types";
import type { createImageArtifact } from "./tools";

export type { CustomUIDataTypes } from "./tools/types";

// Chat Message with Tools
type CreateCodeArtifactTool = InferUITool<
  ReturnType<typeof createCodeArtifact>
>;
type createImageArtifactTool = InferUITool<
  ReturnType<typeof createImageArtifact>
>;

export type ChatTools = {
  createCodeArtifact: CreateCodeArtifactTool;
  createImageArtifact: createImageArtifactTool;
};
// Correct ChatMessage type without nesting
export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export interface GatewayLanguageModelEntry {
  /**
   * The model id used by the remote provider in model settings and for specifying the
   * intended model for text generation.
   */
  id: string;
  /**
   * The display name of the model for presentation in user-facing contexts.
   */
  name: string;
  /**
   * Optional description of the model.
   */
  description?: string | null;
  /**
   * Optional pricing information for the model.
   */
  pricing?: {
    /**
     * Cost per input token in USD.
     */
    input: string;
    /**
     * Cost per output token in USD.
     */
    output: string;
    /**
     * Cost per cached input token in USD.
     * Only present for providers/models that support prompt caching.
     */
    cachedInputTokens?: string;
    /**
     * Cost per input token to create/write cache entries in USD.
     * Only present for providers/models that support prompt caching.
     */
    cacheCreationInputTokens?: string;
  } | null;
  /**
   * Additional AI SDK language model specifications for the model.
   */
  specification: GatewayLanguageModelSpecification;
  /**
   * Optional field to differentiate between model types.
   */
  modelType?: "language" | "embedding" | "image" | null;
}

export type ProviderCapability = "embedding" | "language" | "image";
export interface AIProvider {
  name: string;
  capabilities: ProviderCapability[];
  models: GatewayLanguageModelEntry[];
}

export const gatewayLanguageModelEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  fromVercel: z.boolean().optional(),
  pricing: z
    .object({
      input: z.string(),
      output: z.string(),
      cachedInputTokens: z.string().optional(),
      cacheCreationInputTokens: z.string().optional(),
    })
    .optional()
    .nullable(),
  specification: z.any(),
  modelType: z
    .union([z.literal("language"), z.literal("embedding"), z.literal("image")])
    .optional()
    .nullable(),
});

export interface DynamicField {
  id: string;
  name: string;
  isRequired: boolean;
  type?: "text" | "password" | "url";
  placeholder?: string;
  cloudOnly?: boolean;
}
export const dynamicFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  isRequired: z.boolean(),
  type: z.enum(["text", "password", "url"]).optional(),
  placeholder: z.string().optional(),
  cloudOnly: z.boolean().optional(),
});

export const UIModelSchema = z.object({
  label: z.string(),
  value: z.string(),
  recommended: z.boolean().optional(),
  fields: z.array(dynamicFieldSchema),
});
export type UIModel = z.infer<typeof UIModelSchema>;
export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl?: string;
  apiKeyDocs?: string;
  matchPatterns: string[];
  fields: DynamicField[];
  recommended?: boolean;
  capabilities: ProviderCapability[];
}

export type FileType =
  | "json"
  | "link"
  | "pdf"
  | "csv"
  | "txt"
  | "docx"
  | "other";

export type sourceType = "file" | "text" | "json" | "url" | "api";
