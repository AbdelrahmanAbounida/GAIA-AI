// import { os } from "@orpc/server";
// import type { AppContext } from "../types";
// import { z } from "zod";
// import { db, mcpServer, eq, type MCPServer } from "@gaia/db";
// import {
//   TransportTypeSchema,
//   CustomHeaderSchema,
//   type DBMcpServer,
//   getMCPManager,
// } from "@gaia/ai/mcp";

// const dbServerToConfig = (server: MCPServer): DBMcpServer => {
//   return {
//     id: server.id,
//     createdAt: server.createdAt,
//     updatedAt: server.updatedAt,
//     projectId: server.projectId,
//     name: server.name,
//     description: server.description || undefined,
//     url: server.url || undefined,
//     transportType: server.transportType,
//     connectionType: server.connectionType,
//     command: server.command || undefined,
//     args: server.args || undefined,
//     env: server.env || undefined,
//     customHeaders: server.customHeaders || undefined,
//     oauthClientId: server.oauthClientId || undefined,
//     oauthClientSecret: server.oauthClientSecret || undefined,
//     oauthScope: server.oauthScope || undefined,
//     proxyUrl: server.proxyUrl || undefined,
//     proxyAuthToken: server.proxyAuthToken || undefined,
//     proxyAuthHeader: server.proxyAuthHeader || "Authorization",
//     requestTimeout: server.requestTimeout || 30000,
//     maxTotalTimeout: server.maxTotalTimeout || 60000,
//     resetTimeoutOnProgress: server.resetTimeoutOnProgress || false,
//     capabilities: server.capabilities,
//     serverImplementation: server.serverImplementation,
//     sessionId: server.sessionId || undefined,
//     protocolVersion: server.protocolVersion || undefined,
//     status: server.status || "disconnected",
//     lastError: server.lastError || undefined,
//     lastConnectedAt: server.lastConnectedAt,
//   };
// };

// export const validateMCP = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/mcp/validate",
//     summary: "Validate MCP server health",
//     tags: ["MCP"],
//   })
//   .input(
//     z.object({
//       url: z.string().optional(),
//       transportType: TransportTypeSchema,
//       command: z.string().optional(),
//       args: z.string().optional(),
//       env: z.record(z.string(), z.string()).optional(),
//       customHeaders: z.array(CustomHeaderSchema).optional(),
//       connectionType: z.enum(["direct", "proxy"]).default("proxy"),
//       proxyUrl: z.string().optional(),
//     })
//   )
//   .output(
//     z.object({
//       valid: z.boolean(),
//       message: z.string().optional(),
//       status: z.string(),
//       serverInfo: z.any().optional(),
//       capabilities: z.any().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return { valid: false, message: "Unauthorized", status: "error" };
//     }

//     const manager = getMCPManager();
//     const tempServer: DBMcpServer = {
//       id: "temp-validation",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       projectId: "temp",
//       name: "Validation Server",
//       url: input.url || "",
//       transportType: input.transportType,
//       connectionType: input.connectionType,
//       command: input.command,
//       args: input.args,
//       env: input.env,
//       customHeaders: input.customHeaders,
//       proxyUrl: input.proxyUrl,
//       proxyAuthHeader: "Authorization",
//       requestTimeout: 30000,
//       maxTotalTimeout: 60000,
//       resetTimeoutOnProgress: false,
//       status: "disconnected",
//     };

//     const validation = manager.validateServerConfig(tempServer);
//     if (!validation.valid) {
//       return {
//         valid: false,
//         message: validation.errors.join(", "),
//         status: "error",
//       };
//     }

//     const health = await manager.checkMCPServerHealth(tempServer);

//     return {
//       valid: health.status === "ok",
//       message: health.message,
//       status: health.status,
//       capabilities: health.capabilities,
//       serverInfo: health.serverInfo,
//     };
//   });

// export const detectAuth = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/mcp/detect-auth",
//     summary: "Detect authentication requirements",
//     tags: ["MCP"],
//   })
//   .input(z.object({ url: z.string().url() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       isAuthenticated: z.boolean(),
//       authType: z.enum(["oauth", "bearer", "custom", "none"]).optional(),
//       requiresAuth: z.boolean().optional(),
//       error: z.string().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         isAuthenticated: false,
//         authType: "none",
//         requiresAuth: false,
//       };
//     }

//     const manager = getMCPManager();
//     const res = await manager.detectAuthenticationType(input.url);
//     return {
//       ...res,
//       success: true,
//     };
//   });

// export const detectTransport = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/mcp/detect-transport",
//     summary: "Detect supported transport types",
//     tags: ["MCP"],
//   })
//   .input(z.object({ url: z.string().url() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       supportedTypes: z.array(TransportTypeSchema).optional(),
//       recommended: TransportTypeSchema.optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     const manager = getMCPManager();
//     const res = await manager.detectTransportType(input.url);
//     return {
//       ...res,
//       success: true,
//     };
//   });

// export const createMCPServer = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/mcp",
//     summary: "Create a new MCP server",
//     tags: ["MCP"],
//   })
//   .input(
//     z.object({
//       projectId: z.string(),
//       name: z.string().min(1),
//       description: z.string().optional(),
//       url: z.string().optional(),
//       transportType: TransportTypeSchema,
//       connectionType: z.enum(["direct", "proxy"]).default("proxy"),
//       command: z.string().optional(),
//       args: z.string().optional(),
//       env: z.record(z.string(), z.string()).optional(),
//       customHeaders: z.array(CustomHeaderSchema).optional(),
//       oauthClientId: z.string().optional(),
//       oauthClientSecret: z.string().optional(),
//       oauthScope: z.string().optional(),
//       proxyUrl: z.string().optional(),
//       proxyAuthToken: z.string().optional(),
//       proxyAuthHeader: z.string().default("Authorization"),
//       requestTimeout: z.number().optional(),
//       maxTotalTimeout: z.number().optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       serverId: z.string().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       // Build temp config for validation
//       const tempConfig: DBMcpServer = {
//         id: "temp",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         projectId: input.projectId,
//         name: input.name,
//         url: input.url || "",
//         transportType: input.transportType,
//         connectionType: input.connectionType,
//         command: input.command,
//         args: input.args,
//         env: input.env,
//         customHeaders: input.customHeaders,
//         oauthClientId: input.oauthClientId,
//         oauthClientSecret: input.oauthClientSecret,
//         oauthScope: input.oauthScope,
//         proxyUrl: input.proxyUrl,
//         proxyAuthToken: input.proxyAuthToken,
//         proxyAuthHeader: input.proxyAuthHeader || "Authorization",
//         requestTimeout: input.requestTimeout || 30000,
//         maxTotalTimeout: input.maxTotalTimeout || 60000,
//         resetTimeoutOnProgress: false,
//         status: "disconnected",
//       };

//       // Validate config
//       const validation = manager.validateServerConfig(tempConfig);
//       if (!validation.valid) {
//         return {
//           success: false,
//           message: validation.errors.join(", "),
//         };
//       }

//       // Insert into DB
//       const [newServer] = await db
//         .insert(mcpServer)
//         .values({
//           projectId: input.projectId,
//           name: input.name,
//           description: input.description,
//           url: input.url,
//           transportType: input.transportType,
//           connectionType: input.connectionType,
//           command: input.command,
//           args: input.args,
//           env: input.env,
//           customHeaders: input.customHeaders,
//           oauthClientId: input.oauthClientId,
//           oauthClientSecret: input.oauthClientSecret,
//           oauthScope: input.oauthScope,
//           proxyUrl: input.proxyUrl,
//           proxyAuthToken: input.proxyAuthToken,
//           proxyAuthHeader: input.proxyAuthHeader,
//           requestTimeout: input.requestTimeout,
//           maxTotalTimeout: input.maxTotalTimeout,
//           status: "connecting",
//         })
//         .returning();

//       return {
//         success: true,
//         message: "MCP server created successfully",
//         serverId: newServer.id,
//       };
//     } catch (error) {
//       console.error("Error creating MCP server:", error);
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : "Failed to create MCP server",
//       };
//     }
//   });

// export const listMCPServers = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/mcp",
//     summary: "List all MCP servers",
//     tags: ["MCP"],
//   })
//   .input(z.object({ projectId: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       servers: z.array(z.any()).optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         message: "Unauthorized",
//         success: false,
//       };
//     }

//     try {
//       const servers = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.projectId, input.projectId));

//       return {
//         success: true,
//         servers,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to list MCP servers",
//         servers: [],
//       };
//     }
//   });

// export const getMCPServer = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/mcp/:id",
//     summary: "Get MCP server by ID",
//     tags: ["MCP"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       server: z.any().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         message: "Unauthorized",
//         success: false,
//       };
//     }

//     try {
//       const [server] = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.id, input.id))
//         .limit(1);

//       if (!server) {
//         return {
//           success: false,
//           message: "MCP server not found",
//         };
//       }

//       return {
//         success: true,
//         server,
//       };
//     } catch (error) {
//       console.error("Error getting MCP server:", error);
//       return {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to get MCP server",
//       };
//     }
//   });

// export const updateMCPServer = os
//   .$context<AppContext>()
//   .route({
//     method: "PATCH",
//     path: "/mcp/:id",
//     summary: "Update MCP server",
//     tags: ["MCP"],
//   })
//   .input(
//     z.object({
//       id: z.string(),
//       name: z.string().optional(),
//       description: z.string().optional(),
//       url: z.string().optional(),
//       customHeaders: z.array(CustomHeaderSchema).optional(),
//       oauthClientId: z.string().optional(),
//       oauthClientSecret: z.string().optional(),
//       oauthScope: z.string().optional(),
//       proxyUrl: z.string().optional(),
//       proxyAuthToken: z.string().optional(),
//       status: z
//         .enum(["connecting", "connected", "disconnected", "error"])
//         .optional(),
//       capabilities: z.any().optional(),
//       serverImplementation: z.any().optional(),
//     })
//   )
//   .output(z.object({ success: z.boolean(), message: z.string().optional() }))
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const { id, ...updates } = input;

//       await db.update(mcpServer).set(updates).where(eq(mcpServer.id, id));

//       return { success: true };
//     } catch (error) {
//       console.error("Error updating MCP server:", error);
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : "Failed to update MCP server",
//       };
//     }
//   });

// export const deleteMCPServer = os
//   .$context<AppContext>()
//   .route({
//     method: "DELETE",
//     path: "/mcp/:id",
//     summary: "Delete MCP server",
//     tags: ["MCP"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(z.object({ success: z.boolean(), message: z.string().optional() }))
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       // Disconnect if connected
//       await manager.disconnect(input.id);

//       // Delete from DB
//       await db.delete(mcpServer).where(eq(mcpServer.id, input.id));

//       return { success: true };
//     } catch (error) {
//       console.error("Error deleting MCP server:", error);
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : "Failed to delete MCP server",
//       };
//     }
//   });

// export const connectMCP = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/mcp/:id/connect",
//     summary: "Connect to MCP server",
//     tags: ["MCP"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       capabilities: z.any().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       const [server] = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.id, input.id))
//         .limit(1);

//       if (!server) {
//         return {
//           success: false,
//           message: "Server not found",
//         };
//       }

//       const config = dbServerToConfig(server);

//       if (manager.isConnected(server.id)) {
//         try {
//           // Verify the connection is alive by getting capabilities
//           const capabilities = await manager.getServerCapabilities(config);
//           await db
//             .update(mcpServer)
//             .set({ status: "connected" })
//             .where(eq(mcpServer.id, input.id));

//           return {
//             success: true,
//             message: "Already connected",
//             capabilities,
//           };
//         } catch (error) {
//           // Connection is stale, disconnect and reconnect
//           await manager.disconnect(server.id);
//         }
//       }

//       await db
//         .update(mcpServer)
//         .set({ status: "connecting" })
//         .where(eq(mcpServer.id, input.id));

//       await manager.connect(config);

//       // Get capabilities
//       const capabilities = await manager.getServerCapabilities(config);

//       await db
//         .update(mcpServer)
//         .set({
//           status: "connected",
//           capabilities,
//           lastConnectedAt: new Date(),
//           lastError: null,
//         })
//         .where(eq(mcpServer.id, input.id));

//       return {
//         success: true,
//         message: "Connected successfully",
//         capabilities,
//       };
//     } catch (error) {
//       console.error("❌ Error connecting to MCP server:", error);
//       const errorMsg = error instanceof Error ? error.message : String(error);

//       await db
//         .update(mcpServer)
//         .set({
//           status: "error",
//           lastError: errorMsg,
//         })
//         .where(eq(mcpServer.id, input.id));

//       return {
//         success: false,
//         message: errorMsg,
//       };
//     }
//   });

// export const disconnectMCP = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/mcp/:id/disconnect",
//     summary: "Disconnect from MCP server",
//     tags: ["MCP"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(z.object({ success: z.boolean(), message: z.string().optional() }))
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       const [server] = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.id, input.id))
//         .limit(1);

//       if (!server) {
//         return {
//           success: false,
//           message: "Server not found",
//         };
//       }

//       await manager.disconnect(input.id);

//       await db
//         .update(mcpServer)
//         .set({
//           status: "disconnected",
//           sessionId: null,
//         })
//         .where(eq(mcpServer.id, input.id));

//       return { success: true };
//     } catch (error) {
//       console.error("Error disconnecting from MCP server:", error);
//       return {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to disconnect",
//       };
//     }
//   });

// export const listMCPTools = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/mcp/:id/tools",
//     summary: "List available tools",
//     tags: ["MCP"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       tools: z.array(z.any()).optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       const [server] = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.id, input.id))
//         .limit(1);

//       if (!server) {
//         return {
//           success: false,
//           message: "Server not found",
//         };
//       }

//       const config = dbServerToConfig(server);

//       // Connect if not already connected
//       if (!manager.isConnected(server.id)) {
//         await manager.connect(config);
//       }

//       const tools = await manager.listTools(config);

//       return {
//         success: true,
//         tools: Object.values(tools),
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to list tools",
//         tools: [],
//       };
//     }
//   });

// export const listMCPResources = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/mcp/:id/resources",
//     summary: "List available resources",
//     tags: ["MCP"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       resources: z.array(z.any()).optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       const [server] = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.id, input.id))
//         .limit(1);

//       if (!server) {
//         return {
//           success: false,
//           message: "Server not found",
//         };
//       }

//       const config = dbServerToConfig(server);

//       // Connect if not already connected
//       if (!manager.isConnected(server.id)) {
//         await manager.connect(config);
//       }

//       const result = await manager.listResources(config);

//       return {
//         success: true,
//         resources: result.resources,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to list resources",
//         resources: [],
//       };
//     }
//   });

// export const listMCPPrompts = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/mcp/:id/prompts",
//     summary: "List available prompts",
//     tags: ["MCP"],
//   })
//   .input(z.object({ id: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       prompts: z.array(z.any()).optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       const [server] = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.id, input.id))
//         .limit(1);

//       if (!server) {
//         return {
//           success: false,
//           message: "Server not found",
//         };
//       }

//       const config = dbServerToConfig(server);

//       // Connect if not already connected
//       if (!manager.isConnected(server.id)) {
//         await manager.connect(config);
//       }

//       const result = await manager.listPrompts(config);

//       return {
//         success: true,
//         prompts: result.prompts,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to list prompts",
//         prompts: [],
//       };
//     }
//   });

// export const readMCPResource = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/mcp/:id/resources/read",
//     summary: "Read a resource",
//     tags: ["MCP"],
//   })
//   .input(
//     z.object({
//       id: z.string(),
//       uri: z.string(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       result: z.any().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       const [server] = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.id, input.id))
//         .limit(1);

//       if (!server) {
//         return {
//           success: false,
//           message: "Server not found",
//         };
//       }

//       const config = dbServerToConfig(server);

//       // Connect if not already connected
//       if (!manager.isConnected(server.id)) {
//         await manager.connect(config);
//       }

//       const result = await manager.readResource(config, input.uri);

//       return {
//         success: true,
//         result,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to read resource",
//       };
//     }
//   });

// export const getMCPPrompt = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/mcp/:id/prompts/get",
//     summary: "Get a prompt",
//     tags: ["MCP"],
//   })
//   .input(
//     z.object({
//       id: z.string(),
//       promptName: z.string(),
//       args: z.record(z.string(), z.string()).optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string().optional(),
//       result: z.any().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context?.session?.user) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     try {
//       const manager = getMCPManager();

//       const [server] = await db
//         .select()
//         .from(mcpServer)
//         .where(eq(mcpServer.id, input.id))
//         .limit(1);

//       if (!server) {
//         return {
//           success: false,
//           message: "Server not found",
//         };
//       }

//       const config = dbServerToConfig(server);

//       // Connect if not already connected
//       if (!manager.isConnected(server.id)) {
//         await manager.connect(config);
//       }

//       const result = await manager.getPrompt(
//         config,
//         input.promptName,
//         input.args
//       );

//       return {
//         success: true,
//         result,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to get prompt",
//       };
//     }
//   });

// export const MCPRouter = os.$context<AppContext>().router({
//   // Validation
//   validateMCP,
//   detectAuth,
//   detectTransport,

//   // CRUD
//   createMCPServer,
//   listMCPServers,
//   getMCPServer,
//   updateMCPServer,
//   deleteMCPServer,

//   // Connection
//   connectMCP,
//   disconnectMCP,

//   // Operations
//   listMCPTools,
//   listMCPResources,
//   listMCPPrompts,
//   readMCPResource,
//   getMCPPrompt,
// });
