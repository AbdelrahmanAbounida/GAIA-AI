import type { AppContext } from "../../types";
import type z from "zod";
import { and, apikey, db, eq, project } from "@gaia/db";
import { apiKeySchemas } from "./schema";

export const apiKeyHandlers = {
  createApiKey: async ({
    input,
    context,
  }: {
    input: z.infer<typeof apiKeySchemas.createApiKeyInput>;
    context: AppContext;
  }) => {
    const dbUser = context.session?.user;

    if (!dbUser) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Check if project exists
    const [projectExist] = await db
      .select()
      .from(project)
      .where(eq(project.id, input.projectId))
      .limit(1);

    if (!projectExist) {
      return {
        success: false,
        message: "Project not found",
      };
    }

    try {
      const [newApiKey] = await db
        .insert(apikey)
        .values({
          name: input.name,
          value: input.value,
          projectId: input.projectId,
          userId: dbUser.id,
          expiresAt: input.expiresAt,
        })
        .returning();

      return {
        success: true,
        message: "API key created successfully",
        apiKey: newApiKey,
      };
    } catch (error) {
      console.error("Error creating API key:", error);
      return {
        success: false,
        message: "Failed to create API key",
      };
    }
  },

  deleteApiKey: async ({
    input,
    context,
  }: {
    input: z.infer<typeof apiKeySchemas.deleteApiKeyInput>;
    context: AppContext;
  }) => {
    const dbUser = context.session?.user;

    if (!dbUser) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const result = await db
        .delete(apikey)
        .where(and(eq(apikey.id, input.id), eq(apikey.userId, dbUser.id)))
        .returning();

      if (result.length === 0) {
        return {
          success: false,
          message: "API key not found or unauthorized",
        };
      }

      return {
        success: true,
        message: "API key deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting API key:", error);
      return {
        success: false,
        message: "Failed to delete API key",
      };
    }
  },

  getApiKeys: async ({ context }: { context: AppContext }) => {
    const dbUser = context.session?.user;

    if (!dbUser) {
      return {
        success: false,
        apiKeys: [],
      };
    }

    const keys = await db
      .select()
      .from(apikey)
      .where(eq(apikey.userId, dbUser.id));

    return {
      success: true,
      apiKeys: keys.map((key) => ({
        ...key,
        value: `${key.value.slice(0, 4)}...${key.value.slice(-4)}`,
      })),
    };
  },

  getApiKey: async ({
    input,
    context,
  }: {
    input: z.infer<typeof apiKeySchemas.getApiKeyInput>;
    context: AppContext;
  }) => {
    const dbUser = context.session?.user;

    if (!dbUser) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const [key] = await db
      .select()
      .from(apikey)
      .where(and(eq(apikey.id, input.id), eq(apikey.userId, dbUser.id)));

    if (!key) {
      return {
        success: false,
        message: "API key not found",
      };
    }

    return {
      success: true,
      message: "API key retrieved successfully",
      apiKey: key,
    };
  },
} satisfies Record<string, (...args: any[]) => any>;
