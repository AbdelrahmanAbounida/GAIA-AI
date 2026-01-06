import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const ollamaSpecs = {
  getModelDetails: {
    summary: "Get detailed information about an Ollama model",
    description:
      "Retrieves comprehensive details about a specific Ollama model from the registry",
    tags: ["Ollama"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "name",
        in: "query",
        required: true,
        description: "Model name to get details for",
        schema: { type: "string" },
      },
      {
        name: "verbose",
        in: "query",
        description: "Include verbose information",
        schema: { type: "boolean", default: false },
      },
    ],
    responses: {
      "200": {
        description: "Model details retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                model: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    summary: { type: "string" },
                    downloads: { type: "string" },
                    tags: {
                      type: "array",
                      items: { type: "string" },
                    },
                    lastUpdated: { type: "string" },
                    sizes: {
                      type: "array",
                      items: { type: "string" },
                    },
                    variants: {
                      type: "array",
                      items: { type: "object" },
                    },
                    readme: { type: "string" },
                    command: { type: "string" },
                    url: { type: "string" },
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
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "500": {
        description: "Server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  searchOllama: {
    summary: "Search Ollama model registry",
    description:
      "Search for available Ollama models with optional filtering and sorting",
    tags: ["Ollama"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "query",
        in: "query",
        description: "Search query string",
        schema: { type: "string", default: "" },
      },
      {
        name: "categories",
        in: "query",
        description: "Filter by model categories",
        schema: {
          type: "array",
          items: {
            type: "string",
            enum: ["embedding", "cloud", "vision", "tools", "thinking"],
          },
        },
      },
      {
        name: "order",
        in: "query",
        description: "Sort order for results",
        schema: {
          type: "string",
          enum: ["newest", "popular"],
          default: "newest",
        },
      },
    ],
    responses: {
      "200": {
        description: "Search completed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                models: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      tags: {
                        type: "array",
                        items: { type: "string" },
                      },
                      downloads: { type: "number" },
                      lastUpdated: { type: "string" },
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
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "500": {
        description: "Search failed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  pullModel: {
    summary: "Pull an Ollama model",
    description:
      "Initiates download of an Ollama model to the local Ollama instance",
    tags: ["Ollama"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["modelName"],
            properties: {
              modelName: {
                type: "string",
                minLength: 1,
                description: "Name of the model to pull",
                example: "llama2",
              },
              baseUrl: {
                type: "string",
                format: "uri",
                description: "Optional Ollama server URL",
                example: "http://localhost:11434",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Model pull started successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Started pulling model: llama2",
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
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "503": {
        description: "Ollama service not running",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: {
                  type: "string",
                  example:
                    "Ollama is not running. Please start Ollama and try again.",
                },
              },
            },
          },
        },
      },
      "500": {
        description: "Pull failed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: {
                  type: "string",
                  example: "Failed to pull model",
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getPullStatus: {
    summary: "Get model pull status",
    description:
      "Retrieves the current download progress for a model being pulled",
    tags: ["Ollama"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "modelName",
        in: "query",
        required: true,
        description: "Name of the model being pulled",
        schema: { type: "string" },
      },
      {
        name: "baseUrl",
        in: "query",
        description: "Optional Ollama server URL",
        schema: { type: "string", format: "uri" },
      },
    ],
    responses: {
      "200": {
        description: "Pull status retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                status: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["pulling", "extracting", "complete", "error"],
                    },
                    progress: {
                      type: "number",
                      minimum: 0,
                      maximum: 100,
                      description: "Download progress percentage",
                    },
                    digest: { type: "string" },
                    total: {
                      type: "number",
                      description: "Total bytes to download",
                    },
                    completed: {
                      type: "number",
                      description: "Bytes downloaded",
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
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "500": {
        description: "Failed to get pull status",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  listModels: {
    summary: "List installed Ollama models",
    description:
      "Retrieves all models currently installed on the Ollama instance",
    tags: ["Ollama"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "baseUrl",
        in: "query",
        description: "Optional Ollama server URL",
        schema: { type: "string", format: "uri" },
      },
    ],
    responses: {
      "200": {
        description: "Models listed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                models: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Model name",
                      },
                      size: {
                        type: "number",
                        description: "Model size in bytes",
                      },
                      digest: {
                        type: "string",
                        description: "Model digest hash",
                      },
                      modified_at: {
                        type: "string",
                        description: "Last modified timestamp",
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
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "503": {
        description: "Ollama service not running",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Ollama is not running" },
                models: { type: "array", items: {} },
              },
            },
          },
        },
      },
      "500": {
        description: "Failed to list models",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string" },
                models: { type: "array", items: {} },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deleteModel: {
    summary: "Delete an Ollama model",
    description: "Removes a model from the local Ollama instance",
    tags: ["Ollama"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["modelName"],
            properties: {
              modelName: {
                type: "string",
                minLength: 1,
                description: "Name of the model to delete",
                example: "llama2",
              },
              baseUrl: {
                type: "string",
                format: "uri",
                description: "Optional Ollama server URL",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Model deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Successfully deleted model: llama2",
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
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Model not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Model not found" },
              },
            },
          },
        },
      },
      "500": {
        description: "Failed to delete model",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  checkConnection: {
    summary: "Check Ollama connection",
    description:
      "Verifies connectivity to the Ollama server and checks if it's running",
    tags: ["Ollama"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "baseUrl",
        in: "query",
        description: "Optional Ollama server URL to check",
        schema: { type: "string", format: "uri" },
      },
      {
        name: "apiKey",
        in: "query",
        description: "Optional API key for authentication",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Connection check completed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                connected: {
                  type: "boolean",
                  description: "Whether connection was successful",
                },
                version: {
                  type: "string",
                  description: "Ollama version if connected",
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
                connected: { type: "boolean", example: false },
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "500": {
        description: "Connection check failed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                connected: { type: "boolean", example: false },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  showModel: {
    summary: "Show detailed model information",
    description:
      "Retrieves detailed information about an installed Ollama model including capabilities and parameters",
    tags: ["Ollama"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "modelName",
        in: "query",
        required: true,
        description: "Name of the model to inspect",
        schema: { type: "string" },
      },
      {
        name: "verbose",
        in: "query",
        description: "Include verbose model information",
        schema: { type: "boolean", default: false },
      },
      {
        name: "baseUrl",
        in: "query",
        description: "Optional Ollama server URL",
        schema: { type: "string", format: "uri" },
      },
    ],
    responses: {
      "200": {
        description: "Model information retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                capabilities: {
                  type: "array",
                  items: { type: "string" },
                  description: "Model capabilities and features",
                },
                details: {
                  type: "object",
                  properties: {
                    parent_model: {
                      type: "string",
                      description: "Parent model name",
                    },
                    format: {
                      type: "string",
                      description: "Model format (e.g., gguf)",
                    },
                    family: {
                      type: "string",
                      description: "Model family",
                    },
                    families: {
                      type: "array",
                      items: { type: "string" },
                      description: "Model family hierarchy",
                    },
                    parameter_size: {
                      type: "string",
                      description: "Number of parameters (e.g., 7B)",
                    },
                    quantization_level: {
                      type: "string",
                      description: "Quantization level (e.g., Q4_0)",
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
                error: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
      "404": {
        description: "Model not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Model not found" },
              },
            },
          },
        },
      },
      "500": {
        description: "Failed to get model information",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,
};
