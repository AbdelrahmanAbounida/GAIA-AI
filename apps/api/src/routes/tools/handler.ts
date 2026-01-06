import type { AppContext } from "../../types";
import { toolSchemas } from "./schema";
import type z from "zod";
import { count, db, desc, eq, tool } from "@gaia/db";

export const toolHandlers = {
  createTool: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof toolSchemas.createToolInput>;
  }) => {
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
  },

  listTools: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof toolSchemas.listToolsInput>;
  }) => {
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
  },

  getTool: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof toolSchemas.getToolInput>;
  }) => {
    if (!context.session?.user) {
      return { success: false, tool: null, message: "Unauthorized" };
    }

    const [toolResult] = await db
      .select()
      .from(tool)
      .where(eq(tool.id, input.id))
      .limit(1);

    if (!toolResult) {
      return { success: false, tool: null, message: "Tool not found" };
    }

    return { success: true, tool: toolResult };
  },

  updateTool: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof toolSchemas.updateToolInput>;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    await db.update(tool).set(input.tool).where(eq(tool.id, input.toolId));

    return { success: true, message: "Tool updated successfully" };
  },

  deleteTool: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof toolSchemas.deleteToolInput>;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    await db.delete(tool).where(eq(tool.id, input.id));

    return { success: true, message: "Tool deleted successfully" };
  },

  triggerToolActivation: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof toolSchemas.triggerToolActivationInput>;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    await db
      .update(tool)
      .set({ enabled: input.activeState })
      .where(eq(tool.id, input.toolId));

    return { success: true, message: "Tool activation updated successfully" };
  },
} satisfies Record<string, (...args: any[]) => any>;
