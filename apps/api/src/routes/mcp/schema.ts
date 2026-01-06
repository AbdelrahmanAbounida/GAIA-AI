import { z } from "zod";
import { TransportTypeSchema, CustomHeaderSchema } from "@gaia/ai/mcp";

export const mcpSchemas = {
  // Validation schemas
  validateMCPInput: z.object({
    url: z.string().optional(),
    transportType: TransportTypeSchema,
    command: z.string().optional(),
    args: z.string().optional(),
    env: z.record(z.string(), z.string()).optional(),
    customHeaders: z.array(CustomHeaderSchema).optional(),
    connectionType: z.enum(["direct", "proxy"]).default("proxy"),
    proxyUrl: z.string().optional(),
  }),

  validateMCPOutput: z.object({
    valid: z.boolean(),
    message: z.string().optional(),
    status: z.string(),
    serverInfo: z.any().optional(),
    capabilities: z.any().optional(),
  }),

  detectAuthInput: z.object({
    url: z.string().url(),
  }),

  detectAuthOutput: z.object({
    success: z.boolean(),
    isAuthenticated: z.boolean(),
    authType: z.enum(["oauth", "bearer", "custom", "none"]).optional(),
    requiresAuth: z.boolean().optional(),
    error: z.string().optional(),
  }),

  detectTransportInput: z.object({
    url: z.string().url(),
  }),

  detectTransportOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    supportedTypes: z.array(TransportTypeSchema).optional(),
    recommended: TransportTypeSchema.optional(),
  }),

  // CRUD schemas
  createMCPServerInput: z.object({
    projectId: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    url: z.string().optional(),
    transportType: TransportTypeSchema,
    connectionType: z.enum(["direct", "proxy"]).default("proxy"),
    command: z.string().optional(),
    args: z.string().optional(),
    env: z.record(z.string(), z.string()).optional(),
    customHeaders: z.array(CustomHeaderSchema).optional(),
    oauthClientId: z.string().optional(),
    oauthClientSecret: z.string().optional(),
    oauthScope: z.string().optional(),
    proxyUrl: z.string().optional(),
    proxyAuthToken: z.string().optional(),
    proxyAuthHeader: z.string().default("Authorization"),
    requestTimeout: z.number().optional(),
    maxTotalTimeout: z.number().optional(),
  }),

  createMCPServerOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    serverId: z.string().optional(),
  }),

  listMCPServersInput: z.object({
    projectId: z.string(),
  }),

  listMCPServersOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    servers: z.array(z.any()).optional(),
  }),

  getMCPServerInput: z.object({
    id: z.string(),
  }),

  getMCPServerOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    server: z.any().optional(),
  }),

  updateMCPServerInput: z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    customHeaders: z.array(CustomHeaderSchema).optional(),
    oauthClientId: z.string().optional(),
    oauthClientSecret: z.string().optional(),
    oauthScope: z.string().optional(),
    proxyUrl: z.string().optional(),
    proxyAuthToken: z.string().optional(),
    status: z
      .enum(["connecting", "connected", "disconnected", "error"])
      .optional(),
    capabilities: z.any().optional(),
    serverImplementation: z.any().optional(),
  }),

  updateMCPServerOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
  }),

  deleteMCPServerInput: z.object({
    id: z.string(),
  }),

  deleteMCPServerOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
  }),

  // Connection schemas
  connectMCPInput: z.object({
    id: z.string(),
  }),

  connectMCPOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    capabilities: z.any().optional(),
  }),

  disconnectMCPInput: z.object({
    id: z.string(),
  }),

  disconnectMCPOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
  }),

  // Operations schemas
  listMCPToolsInput: z.object({
    id: z.string(),
  }),

  listMCPToolsOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    tools: z.array(z.any()).optional(),
  }),

  listMCPResourcesInput: z.object({
    id: z.string(),
  }),

  listMCPResourcesOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    resources: z.array(z.any()).optional(),
  }),

  listMCPPromptsInput: z.object({
    id: z.string(),
  }),

  listMCPPromptsOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    prompts: z.array(z.any()).optional(),
  }),

  readMCPResourceInput: z.object({
    id: z.string(),
    uri: z.string(),
  }),

  readMCPResourceOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    result: z.any().optional(),
  }),

  getMCPPromptInput: z.object({
    id: z.string(),
    promptName: z.string(),
    args: z.record(z.string(), z.string()).optional(),
  }),

  getMCPPromptOutput: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    result: z.any().optional(),
  }),
};
