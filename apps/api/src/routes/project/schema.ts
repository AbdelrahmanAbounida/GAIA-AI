import { z } from "zod";
import { createProjectSchema, ProjectSchema } from "@gaia/db";

export const projectSchemas = {
  // Input schemas
  getProjectsInput: z.object({
    searchWord: z.string().optional().describe("Search term for project name"),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .default(20)
      .describe("Number of results per page"),
    cursor: z.string().optional().default("").describe("Pagination cursor"),
    offset: z.coerce
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Pagination offset"),
  }),

  getProjectInput: z.object({
    projectId: z.string().describe("Project ID"),
  }),

  createProjectInput: createProjectSchema.omit({ userId: true }),

  deleteProjectInput: z.object({
    projectId: z.string().describe("Project ID to delete"),
  }),

  // Output schemas
  getProjectsOutput: z.object({
    success: z.boolean(),
    projects: z.array(ProjectSchema),
    nextCursor: z.string().optional(),
    nextOffset: z.number().optional(),
    hasMore: z.boolean(),
    total: z.number(),
    message: z.string().optional(),
  }),

  getProjectOutput: z.object({
    success: z.boolean(),
    project: ProjectSchema.optional(),
    message: z.string().optional(),
  }),

  createProjectOutput: z.object({
    success: z.boolean(),
    message: z.string(),
    project: ProjectSchema.optional(),
  }),

  deleteProjectOutput: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
};
