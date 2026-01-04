import { os } from "@orpc/server";
import type { AppContext } from "../types";
import { z } from "zod";
import {
  count,
  createToolSchema,
  db,
  desc,
  eq,
  tool,
  ToolSchema,
} from "@gaia/db";

// TODO:: take custom input / output schema
export const createTool = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/tools",
    summary: "Create a new tool",
    tags: ["Tools"],
  })
  .input(
    z.object({
      projectId: z.string(),
      name: z.string(),
      description: z.string(),
      language: z.enum(["javascript", "python"]),
      dependencies: z.array(z.string()),
      code: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    const [newTool] = await db
      .insert(tool)
      .values({
        name: input.name,
        description: input.description,
        language: input.language,
        enabled: true,
        projectId: input.projectId,
        code: input.code,
        dependencies: input.dependencies,
      })
      .returning();

    return { success: true, message: "Tool created successfully" };
  });

export const listTools = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/tools",
    summary: "List all tools with pagination",
    tags: ["Tools"],
  })
  .input(
    z.object({
      projectId: z.string(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      tools: z.array(ToolSchema),
      total: z.number(),
      hasMore: z.boolean(),
      nextOffset: z.number().optional(),
      message: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return {
        success: false,
        tools: [],
        total: 0,
        hasMore: false,
        message: "Unauthorized",
      };
    }

    const { projectId, limit, offset } = input;

    const whereClause = eq(tool.projectId, projectId);

    const [toolsResult, totalCount] = await Promise.all([
      db
        .select()
        .from(tool)
        .where(whereClause)
        .limit(limit + 1)
        .offset(offset)
        .orderBy(desc(tool.createdAt)),
      db.select({ count: count() }).from(tool).where(whereClause),
    ]);

    const hasMore = toolsResult.length > limit;
    const toolsToReturn = hasMore ? toolsResult.slice(0, limit) : toolsResult;

    return {
      success: true,
      tools: toolsToReturn,
      total: Number(totalCount[0]?.count ?? 0),
      hasMore,
      nextOffset: hasMore ? offset + limit : undefined,
    };
  });

export const triggerToolActivation = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/tools/:id/activate",
    summary: "Activate a tool",
    tags: ["Tools"],
  })
  .input(z.object({ toolId: z.string(), activeState: z.boolean() }))
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    await db
      .update(tool)
      .set({ enabled: input.activeState })
      .where(eq(tool.id, input.toolId));
    return { success: true, message: "Tool activated successfully" };
  });

export const updateTool = os
  .$context<AppContext>()
  .route({
    method: "PUT",
    path: "/tools/:id",
    summary: "Update a tool",
    tags: ["Tools"],
  })
  .input(
    z.object({
      toolId: z.string(),
      tool: createToolSchema.partial(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    const result = await db
      .update(tool)
      .set(input.tool)
      .where(eq(tool.id, input.toolId));
    return { success: true, message: "Tool updated successfully" };
  });

export const deleteTool = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/tools/:id",
    summary: "Delete a tool",
    tags: ["Tools"],
  })
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    const result = await db.delete(tool).where(eq(tool.id, input.id));
    return { success: true, message: "Tool deleted successfully" };
  });

export const ToolsRouter = os.$context<AppContext>().router({
  createTool,
  listTools,
  updateTool,
  deleteTool,
  triggerToolActivation,
});
