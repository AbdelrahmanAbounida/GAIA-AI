import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { mcpSchemas } from "./schema";
import { mcpHandlers } from "./handler";

export const validateMCP = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/mcp/validate",
    summary: "Validate MCP server health",
    tags: ["MCP"],
  })
  .input(mcpSchemas.validateMCPInput)
  .output(mcpSchemas.validateMCPOutput)
  .handler(mcpHandlers.validateMCP);

export const detectAuth = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/mcp/detect-auth",
    summary: "Detect authentication requirements",
    tags: ["MCP"],
  })
  .input(mcpSchemas.detectAuthInput)
  .output(mcpSchemas.detectAuthOutput)
  .handler(mcpHandlers.detectAuth);

export const detectTransport = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/mcp/detect-transport",
    summary: "Detect supported transport types",
    tags: ["MCP"],
  })
  .input(mcpSchemas.detectTransportInput)
  .output(mcpSchemas.detectTransportOutput)
  .handler(mcpHandlers.detectTransport);

export const createMCPServer = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/mcp",
    summary: "Create a new MCP server",
    tags: ["MCP"],
  })
  .input(mcpSchemas.createMCPServerInput)
  .output(mcpSchemas.createMCPServerOutput)
  .handler(mcpHandlers.createMCPServer);

export const listMCPServers = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/mcp",
    summary: "List all MCP servers",
    tags: ["MCP"],
  })
  .input(mcpSchemas.listMCPServersInput)
  .output(mcpSchemas.listMCPServersOutput)
  .handler(mcpHandlers.listMCPServers);

export const getMCPServer = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/mcp/:id",
    summary: "Get MCP server by ID",
    tags: ["MCP"],
  })
  .input(mcpSchemas.getMCPServerInput)
  .output(mcpSchemas.getMCPServerOutput)
  .handler(mcpHandlers.getMCPServer);

export const updateMCPServer = os
  .$context<AppContext>()
  .route({
    method: "PATCH",
    path: "/mcp/:id",
    summary: "Update MCP server",
    tags: ["MCP"],
  })
  .input(mcpSchemas.updateMCPServerInput)
  .output(mcpSchemas.updateMCPServerOutput)
  .handler(mcpHandlers.updateMCPServer);

export const deleteMCPServer = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/mcp/:id",
    summary: "Delete MCP server",
    tags: ["MCP"],
  })
  .input(mcpSchemas.deleteMCPServerInput)
  .output(mcpSchemas.deleteMCPServerOutput)
  .handler(mcpHandlers.deleteMCPServer);

export const connectMCP = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/mcp/:id/connect",
    summary: "Connect to MCP server",
    tags: ["MCP"],
  })
  .input(mcpSchemas.connectMCPInput)
  .output(mcpSchemas.connectMCPOutput)
  .handler(mcpHandlers.connectMCP);

export const disconnectMCP = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/mcp/:id/disconnect",
    summary: "Disconnect from MCP server",
    tags: ["MCP"],
  })
  .input(mcpSchemas.disconnectMCPInput)
  .output(mcpSchemas.disconnectMCPOutput)
  .handler(mcpHandlers.disconnectMCP);

export const listMCPTools = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/mcp/:id/tools",
    summary: "List available tools",
    tags: ["MCP"],
  })
  .input(mcpSchemas.listMCPToolsInput)
  .output(mcpSchemas.listMCPToolsOutput)
  .handler(mcpHandlers.listMCPTools);

export const listMCPResources = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/mcp/:id/resources",
    summary: "List available resources",
    tags: ["MCP"],
  })
  .input(mcpSchemas.listMCPResourcesInput)
  .output(mcpSchemas.listMCPResourcesOutput)
  .handler(mcpHandlers.listMCPResources);

export const listMCPPrompts = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/mcp/:id/prompts",
    summary: "List available prompts",
    tags: ["MCP"],
  })
  .input(mcpSchemas.listMCPPromptsInput)
  .output(mcpSchemas.listMCPPromptsOutput)
  .handler(mcpHandlers.listMCPPrompts);

export const readMCPResource = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/mcp/:id/resources/read",
    summary: "Read a resource",
    tags: ["MCP"],
  })
  .input(mcpSchemas.readMCPResourceInput)
  .output(mcpSchemas.readMCPResourceOutput)
  .handler(mcpHandlers.readMCPResource);

export const getMCPPrompt = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/mcp/:id/prompts/get",
    summary: "Get a prompt",
    tags: ["MCP"],
  })
  .input(mcpSchemas.getMCPPromptInput)
  .output(mcpSchemas.getMCPPromptOutput)
  .handler(mcpHandlers.getMCPPrompt);

export const MCPRouter = os.$context<AppContext>().router({
  // Validation
  validateMCP,
  detectAuth,
  detectTransport,

  // CRUD
  createMCPServer,
  listMCPServers,
  getMCPServer,
  updateMCPServer,
  deleteMCPServer,

  // Connection
  connectMCP,
  disconnectMCP,

  // Operations
  listMCPTools,
  listMCPResources,
  listMCPPrompts,
  readMCPResource,
  getMCPPrompt,
});
