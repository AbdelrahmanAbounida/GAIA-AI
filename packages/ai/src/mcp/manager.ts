import {
  experimental_createMCPClient as createMCPClient,
  type experimental_MCPClient as MCPClient,
} from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type {
  GetPromptResult,
  ListPromptsResult,
  ListResourcesResult,
  ListResourceTemplatesResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const TransportTypeSchema = z.enum(["stdio", "sse", "streamable-http"]);
export type TransportType = z.infer<typeof TransportTypeSchema>;

export const CustomHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});
export type CustomHeader = z.infer<typeof CustomHeaderSchema>;

export interface DBMcpServer {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  projectId: string;
  name: string;
  description?: string;
  url?: string;
  transportType: TransportType;
  connectionType: "direct" | "proxy";
  command?: string;
  args?: string;
  env?: Record<string, string>;
  customHeaders?: CustomHeader[];
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthScope?: string;
  proxyUrl?: string;
  proxyAuthToken?: string;
  proxyAuthHeader?: string;
  requestTimeout: number;
  maxTotalTimeout: number;
  resetTimeoutOnProgress?: boolean;
  capabilities?: unknown;
  serverImplementation?: unknown;
  sessionId?: string;
  protocolVersion?: string;
  status: "connected" | "disconnected" | "error" | "connecting";
  lastError?: string;
  lastConnectedAt?: Date | null;
}

interface MCPConnection {
  client: MCPClient;
  serverId: string;
  serverName: string;
  lastActivity: Date;
  config: DBMcpServer;
}

export interface MCPToolsResponse {
  serverId: string;
  serverName: string;
  tools: Record<string, any>;
  error?: string;
}

export interface HealthCheckResult {
  status: "ok" | "error";
  message?: string;
  serverInfo?: any;
  capabilities?: any;
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  authType?: "oauth" | "bearer" | "custom" | "none";
  requiresAuth?: boolean;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class MCPConnectionManager {
  private connections: Map<string, MCPConnection> = new Map();
  private serverConfigs: Map<string, DBMcpServer> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private staleThresholdMs: number;

  constructor(staleThresholdMinutes: number = 30) {
    this.staleThresholdMs = staleThresholdMinutes * 60 * 1000;
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupStaleConnections();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Internal method to get or reconnect to a client
   * @private
   */
  private async _getClient(server: DBMcpServer): Promise<MCPClient | null> {
    // Try to get existing connection
    const connection = this.connections.get(server.id);
    if (connection) {
      connection.lastActivity = new Date();
      return connection.client;
    }

    try {
      console.log(`Attempting to reconnect to ${server.name}...`);
      const client = await this.connect(server);
      return client;
    } catch (error) {
      console.error(`Failed to reconnect to ${server.name}:`, error);
      return null;
    }
  }

  /**
   * Validate server configuration
   */
  validateServerConfig(server: DBMcpServer): ValidationResult {
    const errors: string[] = [];

    if (!server.transportType) {
      errors.push("Transport type is required");
    }

    if (server.transportType === "stdio") {
      if (!server.command) {
        errors.push("Command is required for STDIO transport");
      }
      if (server.connectionType === "direct") {
        errors.push("STDIO transport requires proxy connection");
      }
    } else {
      if (!server.url) {
        errors.push("URL is required for SSE and HTTP transports");
      }
    }

    if (server.connectionType === "proxy" && !server.proxyUrl) {
      errors.push("Proxy URL is required for proxy connection");
    }

    if (server.customHeaders) {
      const headerValidation = this.validateCustomHeaders(server.customHeaders);
      if (!headerValidation.valid) {
        errors.push(...headerValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate custom headers
   */
  validateCustomHeaders(headers: CustomHeader[]): ValidationResult {
    const errors: string[] = [];

    headers.forEach((header, index) => {
      if (header.enabled) {
        if (!header.name.trim()) {
          errors.push(`Header ${index + 1}: Name is required`);
        }
        if (!header.value.trim()) {
          errors.push(`Header ${index + 1}: Value is required`);
        }

        if (
          header.name.trim().toLowerCase() === "authorization" &&
          header.value.trim().toLowerCase() === "bearer"
        ) {
          errors.push(
            `Header ${index + 1}: Authorization header needs a token after "Bearer"`
          );
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check MCP server health by attempting connection and listing capabilities
   */
  async checkMCPServerHealth(server: DBMcpServer): Promise<HealthCheckResult> {
    let client: MCPClient | undefined;

    try {
      const validation = this.validateServerConfig(server);
      if (!validation.valid) {
        return {
          status: "error",
          message: `Invalid configuration: ${validation.errors.join(", ")}`,
        };
      }

      const transport = this.createTransport(server);
      client = await createMCPClient({
        transport,
        name: "health-check-client",
        version: "1.0.0",
      });

      const [tools, resources, prompts] = await Promise.all([
        client.tools().catch(() => ({})),
        client.listResources().catch(() => ({ resources: [] })),
        client.listPrompts().catch(() => ({ prompts: [] })),
      ]);

      const capabilities = {
        hasTools: Object.keys(tools).length > 0,
        hasResources: resources.resources?.length > 0,
        hasPrompts: prompts.prompts?.length > 0,
        toolCount: Object.keys(tools).length,
        resourceCount: resources.resources?.length || 0,
        promptCount: prompts.prompts?.length || 0,
      };

      return {
        status: "ok",
        message: "Server is responding",
        capabilities,
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (client) {
        try {
          await client.close();
        } catch (e) {
          console.warn("Failed to close health check connection:", e);
        }
      }
    }
  }

  /**
   * Detect authentication type from server by checking response headers
   */
  async detectAuthenticationType(url: string): Promise<AuthCheckResult> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/event-stream, application/json",
        },
      });

      if (response.ok) {
        return {
          isAuthenticated: true,
          authType: "none",
          requiresAuth: false,
        };
      }

      if (response.status === 401 || response.status === 403) {
        const wwwAuth = response.headers.get("www-authenticate");

        if (wwwAuth) {
          const authLower = wwwAuth.toLowerCase();

          if (authLower.includes("bearer")) {
            return {
              isAuthenticated: false,
              authType: "bearer",
              requiresAuth: true,
              error: "Bearer token authentication required",
            };
          }

          if (authLower.includes("oauth")) {
            return {
              isAuthenticated: false,
              authType: "oauth",
              requiresAuth: true,
              error: "OAuth authentication required",
            };
          }

          return {
            isAuthenticated: false,
            authType: "custom",
            requiresAuth: true,
            error: `Authentication required: ${wwwAuth}`,
          };
        }

        return {
          isAuthenticated: false,
          requiresAuth: true,
          error:
            "Authentication required but type unknown (no WWW-Authenticate header)",
        };
      }

      try {
        const transport = new SSEClientTransport(new URL(url));
        const client = await createMCPClient({
          transport,
          name: "auth-detection",
          version: "1.0.0",
        });

        await client.listResources({ options: { timeout: 5000 } });
        await client.close();

        return {
          isAuthenticated: true,
          authType: "none",
          requiresAuth: false,
        };
      } catch (mcpError) {
        return {
          isAuthenticated: false,
          requiresAuth: true,
          error: `MCP connection failed: ${mcpError instanceof Error ? mcpError.message : String(mcpError)}`,
        };
      }
    } catch (error) {
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Detect transport type for URL by trying different transports
   */
  async detectTransportType(url: string): Promise<{
    supportedTypes: TransportType[];
    recommended: TransportType;
    errors: Record<TransportType, string | null>;
  }> {
    const supportedTypes: TransportType[] = [];
    const errors: Record<TransportType, string | null> = {
      sse: null,
      "streamable-http": null,
      stdio: "STDIO requires command and cannot be auto-detected from URL",
    };

    try {
      const sseTransport = new SSEClientTransport(new URL(url));
      const sseClient = await createMCPClient({
        transport: sseTransport,
        name: "transport-detection",
        version: "1.0.0",
      });

      await sseClient.listResources({ options: { timeout: 5000 } });
      supportedTypes.push("sse");
      await sseClient.close();
    } catch (error) {
      errors.sse = error instanceof Error ? error.message : String(error);
    }

    try {
      const httpTransport = new StreamableHTTPClientTransport(new URL(url));
      const httpClient = await createMCPClient({
        transport: httpTransport,
        name: "transport-detection",
        version: "1.0.0",
      });

      await httpClient.listResources({ options: { timeout: 5000 } });
      supportedTypes.push("streamable-http");
      await httpClient.close();
    } catch (error) {
      errors["streamable-http"] =
        error instanceof Error ? error.message : String(error);
    }

    let recommended: TransportType;
    if (supportedTypes.includes("sse")) {
      recommended = "sse";
    } else if (supportedTypes.includes("streamable-http")) {
      recommended = "streamable-http";
    } else {
      recommended = "streamable-http";
    }

    return { supportedTypes, recommended, errors };
  }

  /**
   * Get server capabilities after connection
   */
  async getServerCapabilities(server: DBMcpServer): Promise<{
    tools: string[];
    resources: string[];
    prompts: string[];
    resourceTemplates: string[];
  }> {
    const client = await this._getClient(server);
    if (!client) {
      return {
        tools: [],
        resources: [],
        prompts: [],
        resourceTemplates: [],
      };
    }

    const [tools, resources, prompts, templates] = await Promise.all([
      client
        .tools()
        .then((t) => Object.keys(t))
        .catch(() => []),
      client
        .listResources()
        .then((r) => r.resources.map((res) => res.name))
        .catch(() => []),
      client
        .listPrompts()
        .then((p) => p.prompts.map((pr) => pr.name))
        .catch(() => []),
      client
        .listResourceTemplates()
        .then((t) => t.resourceTemplates.map((rt) => rt.name))
        .catch(() => []),
    ]);

    return {
      tools,
      resources,
      prompts,
      resourceTemplates: templates,
    };
  }

  /**
   * Check proxy health
   */
  async checkProxyHealth(
    proxyUrl: string,
    authToken?: string,
    authHeader: string = "Authorization"
  ): Promise<HealthCheckResult> {
    try {
      const healthUrl = new URL(`${proxyUrl}/health`);
      const headers: Record<string, string> = {};

      if (authToken) {
        headers[authHeader] = `Bearer ${authToken}`;
      }

      const response = await fetch(healthUrl.toString(), { headers });
      const data: any = await response.json();

      if (data?.status !== "ok") {
        throw new Error("Proxy server is not healthy");
      }

      return { status: "ok", message: "Proxy is healthy" };
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to connect to proxy",
      };
    }
  }

  /**
   * Create transport based on server configuration
   */
  private createTransport(server: DBMcpServer): Transport {
    const headers: Record<string, string> = {};

    if (server.customHeaders) {
      server.customHeaders
        .filter((h) => h.enabled && h.name.trim() && h.value.trim())
        .forEach((h) => {
          headers[h.name.trim()] = h.value.trim();
        });
    }

    if (server.transportType === "stdio") {
      if (!server.command) {
        throw new Error(`Server ${server.name}: STDIO requires command`);
      }

      const args = server.args ? server.args.split(" ").filter(Boolean) : [];

      return new StdioClientTransport({
        command: server.command,
        args,
        env: server.env,
      });
    }

    if (!server.url) {
      throw new Error(
        `Server ${server.name}: URL required for ${server.transportType}`
      );
    }

    const url = new URL(server.url);

    if (server.transportType === "sse") {
      return new SSEClientTransport(url, {
        requestInit: { headers },
      });
    }

    if (server.transportType === "streamable-http") {
      return new StreamableHTTPClientTransport(url, {
        requestInit: { headers },
        sessionId: server.sessionId || undefined,
      });
    }

    throw new Error(
      `Server ${server.name}: Unknown transport type ${server.transportType}`
    );
  }

  /**
   * Enhanced connection method with better error handling and timeout support
   */
  async connect(server: DBMcpServer): Promise<MCPClient> {
    const validation = this.validateServerConfig(server);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    // Store server config for potential reconnection
    this.serverConfigs.set(server.id, server);

    const existing = this.connections.get(server.id);
    if (existing) {
      existing.lastActivity = new Date();
      return existing.client;
    }

    if (server.connectionType === "proxy" && server.proxyUrl) {
      const proxyHealth = await this.checkProxyHealth(
        server.proxyUrl,
        server.proxyAuthToken,
        server.proxyAuthHeader
      );
      if (proxyHealth.status !== "ok") {
        throw new Error(`Proxy not available: ${proxyHealth.message}`);
      }
    }

    try {
      const transport = this.createTransport(server);
      const client = await createMCPClient({
        transport,
        name: server.name || "mcp-client",
        version: "1.0.0",
        capabilities: {
          elicitation: {
            applyDefaults: true,
          },
        },
      });

      try {
        await client.tools();
      } catch (testError) {
        await client.close();
        throw new Error(
          `Connection test failed: ${testError instanceof Error ? testError.message : String(testError)}`
        );
      }

      this.connections.set(server.id, {
        client,
        serverId: server.id,
        serverName: server.name,
        lastActivity: new Date(),
        config: server,
      });

      console.log(`✓ Connected to MCP server: ${server.name}`);
      return client;
    } catch (error) {
      console.error(`✗ Failed to connect to ${server.name}:`, error);
      throw new Error(
        `Failed to connect to ${server.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disconnect from a specific server
   */
  async disconnect(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) return;

    try {
      await connection.client.close();
      this.connections.delete(serverId);
      console.log(`✓ Disconnected from: ${connection.serverName}`);
    } catch (error) {
      console.error(
        `✗ Error disconnecting from ${connection.serverName}:`,
        error
      );
    }
  }

  /**
   * Disconnect all connections
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map((id) =>
      this.disconnect(id)
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Get an existing connection
   */
  getConnection(serverId: string): MCPClient | undefined {
    const connection = this.connections.get(serverId);
    if (connection) {
      connection.lastActivity = new Date();
      return connection.client;
    }
    return undefined;
  }

  /**
   * Connect to multiple MCP servers
   */
  async connectMultiple(servers: DBMcpServer[]): Promise<{
    successful: MCPClient[];
    failed: Array<{ serverId: string; serverName: string; error: string }>;
  }> {
    const successful: MCPClient[] = [];
    const failed: Array<{
      serverId: string;
      serverName: string;
      error: string;
    }> = [];

    await Promise.allSettled(
      servers.map(async (server) => {
        try {
          const client = await this.connect(server);
          successful.push(client);
        } catch (error) {
          failed.push({
            serverId: server.id,
            serverName: server.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })
    );

    return { successful, failed };
  }

  /**
   * List tools from a specific server
   */
  async listTools(server: DBMcpServer): Promise<Record<string, any>> {
    const client = await this._getClient(server);
    if (!client) {
      return {};
    }

    try {
      return await client.tools();
    } catch (error) {
      return {};
    }
  }

  /**
   * Get all tools from multiple servers
   */
  async getAllTools(servers: DBMcpServer[]): Promise<{
    combinedTools: Record<string, any>;
    toolsByServer: MCPToolsResponse[];
    errors: string[];
  }> {
    const toolsByServer: MCPToolsResponse[] = [];
    const errors: string[] = [];
    const combinedTools: Record<string, any> = {};

    await this.connectMultiple(servers);

    await Promise.allSettled(
      servers.map(async (server) => {
        try {
          const client = await this._getClient(server);
          if (!client) {
            throw new Error("Unable to connect");
          }

          const tools = await client.tools();

          toolsByServer.push({
            serverId: server.id,
            serverName: server.name,
            tools,
          });

          Object.entries(tools).forEach(([name, tool]) => {
            const prefixedName = `${server.name}_${name}`;
            combinedTools[prefixedName] = tool;
          });
        } catch (error) {
          const errorMsg = `${server.name}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);

          toolsByServer.push({
            serverId: server.id,
            serverName: server.name,
            tools: {},
            error: errorMsg,
          });
        }
      })
    );

    return { combinedTools, toolsByServer, errors };
  }

  /**
   * List prompts from a specific server
   */
  async listPrompts(server: DBMcpServer): Promise<ListPromptsResult> {
    const client = await this._getClient(server);
    if (!client) {
      return { prompts: [] };
    }

    try {
      return await client.listPrompts();
    } catch (error) {
      return { prompts: [] };
    }
  }

  /**
   * Get a specific prompt
   */
  async getPrompt(
    server: DBMcpServer,
    name: string,
    args?: Record<string, string>
  ): Promise<GetPromptResult | null> {
    const client = await this._getClient(server);
    if (!client) {
      return null;
    }

    try {
      return await client.getPrompt({ name, arguments: args });
    } catch (error) {
      console.error(`Failed to get prompt ${name} from ${server.name}:`, error);
      return null;
    }
  }

  /**
   * List resources from a specific server
   */
  async listResources(server: DBMcpServer): Promise<ListResourcesResult> {
    const client = await this._getClient(server);
    if (!client) {
      return { resources: [] };
    }

    try {
      return await client.listResources();
    } catch (error) {
      return { resources: [] };
    }
  }

  /**
   * List resource templates from a specific server
   */
  async listResourceTemplates(
    server: DBMcpServer
  ): Promise<ListResourceTemplatesResult> {
    const client = await this._getClient(server);
    if (!client) {
      return { resourceTemplates: [] };
    }

    try {
      return await client.listResourceTemplates();
    } catch (error) {
      return { resourceTemplates: [] };
    }
  }

  /**
   * Read a specific resource
   */
  async readResource(
    server: DBMcpServer,
    uri: string
  ): Promise<ReadResourceResult | null> {
    const client = await this._getClient(server);
    if (!client) {
      return null;
    }

    try {
      return await client.readResource({ uri });
    } catch (error) {
      console.error(
        `Failed to read resource ${uri} from ${server.name}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get connection status for all servers
   */
  getConnectionStatus(): Array<{
    serverId: string;
    serverName: string;
    connected: boolean;
    lastActivity: Date;
  }> {
    return Array.from(this.connections.values()).map((conn) => ({
      serverId: conn.serverId,
      serverName: conn.serverName,
      connected: true,
      lastActivity: conn.lastActivity,
    }));
  }

  /**
   * Check if a specific server is connected
   */
  isConnected(serverId: string): boolean {
    return this.connections.has(serverId);
  }

  /**
   * Get number of active connections
   */
  getActiveConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Cleanup stale connections
   */
  private cleanupStaleConnections(): void {
    const now = new Date();

    for (const [id, connection] of this.connections.entries()) {
      const inactiveTime = now.getTime() - connection.lastActivity.getTime();

      if (inactiveTime > this.staleThresholdMs) {
        console.log(`⚠ Cleaning up stale connection: ${connection.serverName}`);
        this.disconnect(id);
      }
    }
  }

  /**
   * Destroy manager and cleanup all resources
   */
  async destroy(): Promise<void> {
    clearInterval(this.cleanupInterval);
    await this.disconnectAll();
    this.serverConfigs.clear();
  }
}

export { type MCPClient };

let mcpManagerInstance: MCPConnectionManager | null = null;

export function getMCPManager(): MCPConnectionManager {
  if (!mcpManagerInstance) {
    mcpManagerInstance = new MCPConnectionManager(30);
  }
  return mcpManagerInstance;
}

export interface DynamicMCPResult {
  tools: Record<string, any>;
  clients: MCPClient[];
  cleanup: () => Promise<void>;
}

export const buildDynamicMCPs = async ({
  servers,
}: {
  servers: DBMcpServer[];
}): Promise<DynamicMCPResult> => {
  const manager = getMCPManager();
  const clients: MCPClient[] = [];
  const allTools: Record<string, any> = {};

  const { successful, failed } = await manager.connectMultiple(servers);

  if (failed.length > 0) {
    console.warn("Some MCP servers failed to connect:", failed);
  }

  for (const server of servers) {
    const client = manager.getConnection(server.id);
    if (client) {
      clients.push(client);
      try {
        const tools = await manager.listTools(server);

        Object.entries(tools).forEach(([name, tool]) => {
          const prefixedName = `${server.name}_${name}`;
          allTools[prefixedName] = tool;
        });
      } catch (error) {}
    }
  }

  return {
    tools: allTools,
    clients,
    cleanup: async () => {
      await Promise.all(servers.map((server) => manager.disconnect(server.id)));
    },
  };
};

export const closeMCPClients = async (mcpClients: MCPClient[]) => {
  await Promise.all(mcpClients.map((client) => client.close()));
};
