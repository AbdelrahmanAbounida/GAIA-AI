import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const mcpSpecs = {
  validateMCP: {
    summary: "Validate MCP server configuration",
    description:
      "Validates an MCP server configuration and checks server health before creation",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["transportType"],
            properties: {
              url: {
                type: "string",
                description: "Server URL for HTTP/SSE transport",
              },
              transportType: {
                type: "string",
                enum: ["stdio", "http", "sse"],
                description: "Transport protocol type",
              },
              command: {
                type: "string",
                description: "Command to execute for stdio transport",
              },
              args: {
                type: "string",
                description: "Command arguments for stdio transport",
              },
              env: {
                type: "object",
                additionalProperties: { type: "string" },
                description: "Environment variables",
              },
              customHeaders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    value: { type: "string" },
                  },
                },
                description: "Custom HTTP headers",
              },
              connectionType: {
                type: "string",
                enum: ["direct", "proxy"],
                default: "proxy",
                description: "Connection type",
              },
              proxyUrl: {
                type: "string",
                description: "Proxy URL if using proxy connection",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Validation completed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                valid: { type: "boolean" },
                message: { type: "string" },
                status: {
                  type: "string",
                  enum: ["ok", "error", "timeout"],
                },
                capabilities: {
                  type: "object",
                  description: "Server capabilities if validation successful",
                },
                serverInfo: {
                  type: "object",
                  description: "Server implementation details",
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                valid: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
                status: { type: "string", example: "error" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  detectAuth: {
    summary: "Detect authentication type for MCP server",
    description:
      "Analyzes an MCP server URL to determine required authentication method",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                format: "uri",
                description: "MCP server URL to analyze",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Authentication detection completed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                isAuthenticated: { type: "boolean" },
                authType: {
                  type: "string",
                  enum: ["oauth", "bearer", "custom", "none"],
                },
                requiresAuth: { type: "boolean" },
                error: { type: "string" },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                isAuthenticated: { type: "boolean", example: false },
                authType: { type: "string", example: "none" },
                requiresAuth: { type: "boolean", example: false },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  detectTransport: {
    summary: "Detect supported transport types",
    description:
      "Analyzes an MCP server URL to determine supported transport protocols",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                format: "uri",
                description: "MCP server URL to analyze",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Transport detection completed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                supportedTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["stdio", "http", "sse"],
                  },
                },
                recommended: {
                  type: "string",
                  enum: ["stdio", "http", "sse"],
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  createMCPServer: {
    summary: "Create a new MCP server",
    description: "Creates and registers a new MCP server configuration",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["projectId", "name", "transportType"],
            properties: {
              projectId: {
                type: "string",
                description: "Project ID to associate the server with",
              },
              name: {
                type: "string",
                minLength: 1,
                description: "Server name",
              },
              description: {
                type: "string",
                description: "Server description",
              },
              url: {
                type: "string",
                description: "Server URL for HTTP/SSE transport",
              },
              transportType: {
                type: "string",
                enum: ["stdio", "http", "sse"],
                description: "Transport protocol type",
              },
              connectionType: {
                type: "string",
                enum: ["direct", "proxy"],
                default: "proxy",
                description: "Connection type",
              },
              command: {
                type: "string",
                description: "Command to execute for stdio transport",
              },
              args: {
                type: "string",
                description: "Command arguments",
              },
              env: {
                type: "object",
                additionalProperties: { type: "string" },
                description: "Environment variables",
              },
              customHeaders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    value: { type: "string" },
                  },
                },
                description: "Custom HTTP headers",
              },
              oauthClientId: {
                type: "string",
                description: "OAuth client ID",
              },
              oauthClientSecret: {
                type: "string",
                description: "OAuth client secret",
              },
              oauthScope: {
                type: "string",
                description: "OAuth scope",
              },
              proxyUrl: {
                type: "string",
                description: "Proxy server URL",
              },
              proxyAuthToken: {
                type: "string",
                description: "Proxy authentication token",
              },
              proxyAuthHeader: {
                type: "string",
                default: "Authorization",
                description: "Proxy authentication header name",
              },
              requestTimeout: {
                type: "number",
                description: "Request timeout in milliseconds",
              },
              maxTotalTimeout: {
                type: "number",
                description: "Maximum total timeout in milliseconds",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "MCP server created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "MCP server created successfully",
                },
                serverId: { type: "string" },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "400": {
        description: "Bad request - validation failed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: {
                  type: "string",
                  example: "Invalid server configuration",
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  listMCPServers: {
    summary: "List MCP servers for a project",
    description: "Retrieves all MCP servers configured for a specific project",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "query",
        required: true,
        description: "Project ID to filter servers",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Servers retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                servers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      projectId: { type: "string" },
                      name: { type: "string" },
                      description: { type: ["string", "null"] },
                      url: { type: ["string", "null"] },
                      transportType: {
                        type: "string",
                        enum: ["stdio", "http", "sse"],
                      },
                      connectionType: {
                        type: "string",
                        enum: ["direct", "proxy"],
                      },
                      status: {
                        type: "string",
                        enum: [
                          "connecting",
                          "connected",
                          "disconnected",
                          "error",
                        ],
                      },
                      capabilities: { type: ["object", "null"] },
                      lastConnectedAt: {
                        type: ["string", "null"],
                        format: "date-time",
                      },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getMCPServer: {
    summary: "Get a specific MCP server",
    description: "Retrieves detailed information about a specific MCP server",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "MCP server ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Server retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                server: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    projectId: { type: "string" },
                    name: { type: "string" },
                    description: { type: ["string", "null"] },
                    url: { type: ["string", "null"] },
                    transportType: {
                      type: "string",
                      enum: ["stdio", "http", "sse"],
                    },
                    connectionType: {
                      type: "string",
                      enum: ["direct", "proxy"],
                    },
                    command: { type: ["string", "null"] },
                    args: { type: ["string", "null"] },
                    status: {
                      type: "string",
                      enum: [
                        "connecting",
                        "connected",
                        "disconnected",
                        "error",
                      ],
                    },
                    capabilities: { type: ["object", "null"] },
                    serverImplementation: { type: ["object", "null"] },
                    lastError: { type: ["string", "null"] },
                    lastConnectedAt: {
                      type: ["string", "null"],
                      format: "date-time",
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Server not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "MCP server not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  updateMCPServer: {
    summary: "Update an MCP server",
    description: "Updates configuration for a specific MCP server",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "MCP server ID",
        schema: { type: "string" },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              url: { type: "string" },
              customHeaders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    value: { type: "string" },
                  },
                },
              },
              oauthClientId: { type: "string" },
              oauthClientSecret: { type: "string" },
              oauthScope: { type: "string" },
              proxyUrl: { type: "string" },
              proxyAuthToken: { type: "string" },
              status: {
                type: "string",
                enum: ["connecting", "connected", "disconnected", "error"],
              },
              capabilities: { type: "object" },
              serverImplementation: { type: "object" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Server updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Server not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "MCP server not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deleteMCPServer: {
    summary: "Delete an MCP server",
    description: "Disconnects and deletes a specific MCP server configuration",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "MCP server ID to delete",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Server deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Server not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "MCP server not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  connectMCP: {
    summary: "Connect to an MCP server",
    description:
      "Establishes connection to an MCP server and retrieves capabilities",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "string",
                description: "MCP server ID to connect",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Connected successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Connected successfully",
                },
                capabilities: {
                  type: "object",
                  description: "Server capabilities",
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Server not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Server not found" },
              },
            },
          },
        },
      },
      "500": {
        description: "Connection failed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Connection failed" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  disconnectMCP: {
    summary: "Disconnect from an MCP server",
    description: "Closes connection to an MCP server",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "string",
                description: "MCP server ID to disconnect",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Disconnected successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Server not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Server not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  listMCPTools: {
    summary: "List tools from an MCP server",
    description: "Retrieves all available tools from a connected MCP server",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "query",
        required: true,
        description: "MCP server ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Tools retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                tools: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      inputSchema: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Server not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Server not found" },
                tools: { type: "array", items: {} },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  listMCPResources: {
    summary: "List resources from an MCP server",
    description:
      "Retrieves all available resources from a connected MCP server",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "query",
        required: true,
        description: "MCP server ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Resources retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      uri: { type: "string" },
                      name: { type: "string" },
                      description: { type: "string" },
                      mimeType: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Server not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Server not found" },
                resources: { type: "array", items: {} },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  listMCPPrompts: {
    summary: "List prompts from an MCP server",
    description: "Retrieves all available prompts from a connected MCP server",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "query",
        required: true,
        description: "MCP server ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Prompts retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                prompts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      arguments: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            required: { type: "boolean" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Server not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Server not found" },
                prompts: { type: "array", items: {} },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  readMCPResource: {
    summary: "Read a resource from an MCP server",
    description: "Retrieves the content of a specific resource by URI",
    tags: ["MCP"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "query",
        required: true,
        description: "MCP server ID",
        schema: { type: "string" },
      },
      {
        name: "uri",
        in: "query",
        required: true,
        description: "Resource URI to read",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Resource retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                result: {
                  type: "object",
                  description: "Resource content and metadata",
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Resource not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,
};
