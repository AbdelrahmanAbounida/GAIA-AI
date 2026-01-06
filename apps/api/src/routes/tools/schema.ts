import { z } from "zod";
import { createToolSchema, ToolSchema } from "@gaia/db";

export const toolSchemas = {
  // Input schemas
  createToolInput: z.object({
    projectId: z.string().describe("Project ID"),
    name: z.string().describe("Tool name"),
    description: z.string().describe("Tool description"),
    language: z.enum(["javascript", "python"]).describe("Programming language"),
    dependencies: z.array(z.string()).describe("List of dependencies"),
    code: z.string().describe("Tool code"),
  }),

  listToolsInput: z.object({
    projectId: z.string().describe("Project ID"),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Number of results per page"),
    offset: z.number().optional().default(0).describe("Pagination offset"),
  }),

  getToolInput: z.object({
    id: z.string().describe("Tool ID"),
  }),

  updateToolInput: z.object({
    toolId: z.string().describe("Tool ID to update"),
    tool: createToolSchema.partial().describe("Tool fields to update"),
  }),

  deleteToolInput: z.object({
    id: z.string().describe("Tool ID to delete"),
  }),

  triggerToolActivationInput: z.object({
    toolId: z.string().describe("Tool ID"),
    activeState: z.boolean().describe("Active state to set"),
  }),

  // Output schemas
  createToolOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  listToolsOutput: z.object({
    success: z.boolean(),
    tools: z.array(ToolSchema),
    total: z.number(),
    hasMore: z.boolean(),
    nextOffset: z.number().optional(),
    message: z.string().optional(),
  }),

  getToolOutput: z.object({
    success: z.boolean(),
    tool: ToolSchema.nullable(),
    message: z.string().optional(),
  }),

  updateToolOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  deleteToolOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  triggerToolActivationOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
};
