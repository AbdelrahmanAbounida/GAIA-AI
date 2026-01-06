import { z } from "zod";
import { PromptSchema } from "@gaia/db";

export const promptSchemas = {
  // Input schemas
  getPromptInput: z.object({
    projectId: z
      .string()
      .min(1)
      .describe("The unique identifier of the project"),
  }),

  createPromptInput: z.object({
    projectId: z
      .string()
      .min(1)
      .describe("The unique identifier of the project"),
    prompt: z.string().min(1).describe("The prompt content to be created"),
  }),

  updatePromptInput: z.object({
    projectId: z
      .string()
      .min(1)
      .describe("The unique identifier of the project"),
    prompt: z.string().min(1).describe("The updated prompt content"),
  }),

  deletePromptInput: z.object({
    projectId: z
      .string()
      .min(1)
      .describe("The unique identifier of the project"),
  }),

  // Output schemas
  getPromptOutput: z.object({
    success: z.boolean().describe("Indicates if the operation was successful"),
    prompt: PromptSchema.optional().describe("The prompt object if found"),
    message: z
      .string()
      .optional()
      .describe("Additional message or error information"),
  }),

  mutationOutput: z.object({
    success: z.boolean().describe("Indicates if the operation was successful"),
    message: z.string().describe("Success or error message"),
  }),
};
