import type { AppContext } from "../../types";
import type z from "zod";
import { db, mcpServer, eq, type MCPServer } from "@gaia/db";
import { type DBMcpServer, getMCPManager } from "@gaia/ai/mcp";
import { mcpSchemas } from "./schema";

const dbServerToConfig = (server: MCPServer): DBMcpServer => {
  return {
    id: server.id,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    projectId: server.projectId,
    name: server.name,
    description: server.description || undefined,
    url: server.url || undefined,
    transportType: server.transportType,
    connectionType: server.connectionType,
    command: server.command || undefined,
    args: server.args || undefined,
    env: server.env || undefined,
    customHeaders: server.customHeaders || undefined,
    oauthClientId: server.oauthClientId || undefined,
    oauthClientSecret: server.oauthClientSecret || undefined,
    oauthScope: server.oauthScope || undefined,
    proxyUrl: server.proxyUrl || undefined,
    proxyAuthToken: server.proxyAuthToken || undefined,
    proxyAuthHeader: server.proxyAuthHeader || "Authorization",
    requestTimeout: server.requestTimeout || 30000,
    maxTotalTimeout: server.maxTotalTimeout || 60000,
    resetTimeoutOnProgress: server.resetTimeoutOnProgress || false,
    capabilities: server.capabilities,
    serverImplementation: server.serverImplementation,
    sessionId: server.sessionId || undefined,
    protocolVersion: server.protocolVersion || undefined,
    status: server.status || "disconnected",
    lastError: server.lastError || undefined,
    lastConnectedAt: server.lastConnectedAt,
  };
};

export const mcpHandlers = {
  validateMCP: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.validateMCPInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return { valid: false, message: "Unauthorized", status: "error" };
    }

    const manager = getMCPManager();
    const tempServer: DBMcpServer = {
      id: "temp-validation",
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: "temp",
      name: "Validation Server",
      url: input.url || "",
      transportType: input.transportType,
      connectionType: input.connectionType,
      command: input.command,
      args: input.args,
      env: input.env,
      customHeaders: input.customHeaders,
      proxyUrl: input.proxyUrl,
      proxyAuthHeader: "Authorization",
      requestTimeout: 30000,
      maxTotalTimeout: 60000,
      resetTimeoutOnProgress: false,
      status: "disconnected",
    };

    const validation = manager.validateServerConfig(tempServer);
    if (!validation.valid) {
      return {
        valid: false,
        message: validation.errors.join(", "),
        status: "error",
      };
    }

    const health = await manager.checkMCPServerHealth(tempServer);

    return {
      valid: health.status === "ok",
      message: health.message,
      status: health.status,
      capabilities: health.capabilities,
      serverInfo: health.serverInfo,
    };
  },

  detectAuth: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.detectAuthInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        isAuthenticated: false,
        authType: "none" as const,
        requiresAuth: false,
      };
    }

    const manager = getMCPManager();
    const res = await manager.detectAuthenticationType(input.url);
    return {
      ...res,
      success: true,
    };
  },

  detectTransport: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.detectTransportInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const manager = getMCPManager();
    const res = await manager.detectTransportType(input.url);
    return {
      ...res,
      success: true,
    };
  },

  createMCPServer: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.createMCPServerInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();

      const tempConfig: DBMcpServer = {
        id: "temp",
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: input.projectId,
        name: input.name,
        url: input.url || "",
        transportType: input.transportType,
        connectionType: input.connectionType,
        command: input.command,
        args: input.args,
        env: input.env,
        customHeaders: input.customHeaders,
        oauthClientId: input.oauthClientId,
        oauthClientSecret: input.oauthClientSecret,
        oauthScope: input.oauthScope,
        proxyUrl: input.proxyUrl,
        proxyAuthToken: input.proxyAuthToken,
        proxyAuthHeader: input.proxyAuthHeader || "Authorization",
        requestTimeout: input.requestTimeout || 30000,
        maxTotalTimeout: input.maxTotalTimeout || 60000,
        resetTimeoutOnProgress: false,
        status: "disconnected",
      };

      const validation = manager.validateServerConfig(tempConfig);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.errors.join(", "),
        };
      }

      const [newServer] = await db
        .insert(mcpServer)
        .values({
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          url: input.url,
          transportType: input.transportType,
          connectionType: input.connectionType,
          command: input.command,
          args: input.args,
          env: input.env,
          customHeaders: input.customHeaders,
          oauthClientId: input.oauthClientId,
          oauthClientSecret: input.oauthClientSecret,
          oauthScope: input.oauthScope,
          proxyUrl: input.proxyUrl,
          proxyAuthToken: input.proxyAuthToken,
          proxyAuthHeader: input.proxyAuthHeader,
          requestTimeout: input.requestTimeout,
          maxTotalTimeout: input.maxTotalTimeout,
          status: "connecting",
        })
        .returning();

      return {
        success: true,
        message: "MCP server created successfully",
        serverId: newServer.id,
      };
    } catch (error) {
      console.error("Error creating MCP server:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create MCP server",
      };
    }
  },

  listMCPServers: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.listMCPServersInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        message: "Unauthorized",
        success: false,
      };
    }

    try {
      const servers = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.projectId, input.projectId));

      return {
        success: true,
        servers,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to list MCP servers",
        servers: [],
      };
    }
  },

  getMCPServer: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.getMCPServerInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        message: "Unauthorized",
        success: false,
      };
    }

    try {
      const [server] = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.id, input.id))
        .limit(1);

      if (!server) {
        return {
          success: false,
          message: "MCP server not found",
        };
      }

      return {
        success: true,
        server,
      };
    } catch (error) {
      console.error("Error getting MCP server:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get MCP server",
      };
    }
  },

  updateMCPServer: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.updateMCPServerInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const { id, ...updates } = input;

      await db.update(mcpServer).set(updates).where(eq(mcpServer.id, id));

      return { success: true };
    } catch (error) {
      console.error("Error updating MCP server:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update MCP server",
      };
    }
  },

  deleteMCPServer: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.deleteMCPServerInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();
      await manager.disconnect(input.id);
      await db.delete(mcpServer).where(eq(mcpServer.id, input.id));

      return { success: true };
    } catch (error) {
      console.error("Error deleting MCP server:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete MCP server",
      };
    }
  },

  connectMCP: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.connectMCPInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();

      const [server] = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.id, input.id))
        .limit(1);

      if (!server) {
        return {
          success: false,
          message: "Server not found",
        };
      }

      const config = dbServerToConfig(server);

      if (manager.isConnected(server.id)) {
        try {
          const capabilities = await manager.getServerCapabilities(config);
          await db
            .update(mcpServer)
            .set({ status: "connected" })
            .where(eq(mcpServer.id, input.id));

          return {
            success: true,
            message: "Already connected",
            capabilities,
          };
        } catch (error) {
          console.log("⚠️ Existing connection is stale, reconnecting...");
          await manager.disconnect(server.id);
        }
      }

      await db
        .update(mcpServer)
        .set({ status: "connecting" })
        .where(eq(mcpServer.id, input.id));

      await manager.connect(config);
      const capabilities = await manager.getServerCapabilities(config);

      await db
        .update(mcpServer)
        .set({
          status: "connected",
          capabilities,
          lastConnectedAt: new Date(),
          lastError: null,
        })
        .where(eq(mcpServer.id, input.id));

      return {
        success: true,
        message: "Connected successfully",
        capabilities,
      };
    } catch (error) {
      console.error("❌ Error connecting to MCP server:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);

      await db
        .update(mcpServer)
        .set({
          status: "error",
          lastError: errorMsg,
        })
        .where(eq(mcpServer.id, input.id));

      return {
        success: false,
        message: errorMsg,
      };
    }
  },

  disconnectMCP: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.disconnectMCPInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();

      const [server] = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.id, input.id))
        .limit(1);

      if (!server) {
        return {
          success: false,
          message: "Server not found",
        };
      }

      await manager.disconnect(input.id);

      await db
        .update(mcpServer)
        .set({
          status: "disconnected",
          sessionId: null,
        })
        .where(eq(mcpServer.id, input.id));

      return { success: true };
    } catch (error) {
      console.error("Error disconnecting from MCP server:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to disconnect",
      };
    }
  },

  listMCPTools: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.listMCPToolsInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();

      const [server] = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.id, input.id))
        .limit(1);

      if (!server) {
        return {
          success: false,
          message: "Server not found",
        };
      }

      const config = dbServerToConfig(server);

      if (!manager.isConnected(server.id)) {
        await manager.connect(config);
      }

      const tools = await manager.listTools(config);

      return {
        success: true,
        tools: Object.values(tools),
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to list tools",
        tools: [],
      };
    }
  },

  listMCPResources: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.listMCPResourcesInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();

      const [server] = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.id, input.id))
        .limit(1);

      if (!server) {
        return {
          success: false,
          message: "Server not found",
        };
      }

      const config = dbServerToConfig(server);

      if (!manager.isConnected(server.id)) {
        await manager.connect(config);
      }

      const result = await manager.listResources(config);

      return {
        success: true,
        resources: result.resources,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to list resources",
        resources: [],
      };
    }
  },

  listMCPPrompts: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.listMCPPromptsInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();

      const [server] = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.id, input.id))
        .limit(1);

      if (!server) {
        return {
          success: false,
          message: "Server not found",
        };
      }

      const config = dbServerToConfig(server);

      if (!manager.isConnected(server.id)) {
        await manager.connect(config);
      }

      const result = await manager.listPrompts(config);

      return {
        success: true,
        prompts: result.prompts,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to list prompts",
        prompts: [],
      };
    }
  },

  readMCPResource: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.readMCPResourceInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();

      const [server] = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.id, input.id))
        .limit(1);

      if (!server) {
        return {
          success: false,
          message: "Server not found",
        };
      }

      const config = dbServerToConfig(server);

      if (!manager.isConnected(server.id)) {
        await manager.connect(config);
      }

      const result = await manager.readResource(config, input.uri);

      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to read resource",
      };
    }
  },

  getMCPPrompt: async ({
    input,
    context,
  }: {
    input: z.infer<typeof mcpSchemas.getMCPPromptInput>;
    context: AppContext;
  }) => {
    if (!context?.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      const manager = getMCPManager();

      const [server] = await db
        .select()
        .from(mcpServer)
        .where(eq(mcpServer.id, input.id))
        .limit(1);

      if (!server) {
        return {
          success: false,
          message: "Server not found",
        };
      }

      const config = dbServerToConfig(server);

      if (!manager.isConnected(server.id)) {
        await manager.connect(config);
      }

      const result = await manager.getPrompt(
        config,
        input.promptName,
        input.args
      );

      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get prompt",
      };
    }
  },
};
