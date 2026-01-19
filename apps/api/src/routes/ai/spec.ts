import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const aiSpecs = {
  getAllProviders: {
    summary: "Get all AI providers",
    description:
      "Retrieves all available AI providers with their capabilities (Language, Embeddings, Image) and models",
    tags: ["AI"],
    responses: {
      "200": {
        description: "Providers retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                modelsProviders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      capabilities: {
                        type: "array",
                        items: { type: "string" },
                      },
                      models: {
                        type: "array",
                        items: { type: "object" },
                      },
                    },
                  },
                },
                vectorstoresProviders: {
                  type: "array",
                  items: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getAllModels: {
    summary: "Get all available AI models",
    description: "Retrieves all available AI models categorized by type",
    tags: ["AI"],
    security: [{ Bearer: [] }],
    responses: {
      "200": {
        description: "Models retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                models: {
                  type: "object",
                  properties: {
                    llms: {
                      type: "array",
                      items: { type: "object" },
                    },
                    embeddings: {
                      type: "array",
                      items: { type: "object" },
                    },
                    image: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
                vectorstores: {
                  type: "array",
                  items: { type: "object" },
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

  getUserModels: {
    summary: "Get user's configured AI models",
    description:
      "Retrieves the current user's configured AI models and credentials",
    tags: ["AI"],
    security: [{ Bearer: [] }],
    responses: {
      "200": {
        description: "User models retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                ai_models: {
                  type: "array",
                  items: { type: "object" },
                },
                embeddings: {
                  type: "array",
                  items: { type: "object" },
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
  chatCompletions: {
    summary: "OpenAI-compatible chat completion",
    description:
      "OpenAI-compatible chat completion endpoint with streaming support",
    tags: ["AI"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["projectId", "messages"],
            properties: {
              projectId: {
                type: "string",
                description: "Project identifier (required)",
              },
              chatId: {
                type: "string",
                description: "Chat session identifier (optional)",
              },
              messages: {
                type: "array",
                description: "Array of conversation messages",
                items: {
                  type: "object",
                  required: ["role", "content"],
                  properties: {
                    role: {
                      type: "string",
                      enum: ["system", "user", "assistant"],
                      description: "Message role",
                    },
                    content: {
                      type: "string",
                      description: "Message content",
                    },
                    name: {
                      type: "string",
                      description: "Optional message name",
                    },
                  },
                },
              },
              model: {
                type: "string",
                default: "gpt-4o",
                description: "Model identifier (defaults to gpt-4o)",
              },
              provider: {
                type: "string",
                description: "Provider name (optional)",
              },
              temperature: {
                type: "number",
                default: 0.7,
                minimum: 0,
                maximum: 2,
                description: "Sampling temperature (0-2, default 0.7)",
              },
              max_tokens: {
                type: "number",
                description: "Maximum tokens to generate",
              },
              stream: {
                type: "boolean",
                default: false,
                description: "Enable streaming response",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Chat completion response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "string" },
                object: { type: "string" },
                created: { type: "number" },
                model: { type: "string" },
                choices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "number" },
                      message: {
                        type: "object",
                        properties: {
                          role: { type: "string" },
                          content: { type: "string" },
                        },
                      },
                      finish_reason: { type: "string" },
                    },
                  },
                },
                usage: {
                  type: "object",
                  properties: {
                    prompt_tokens: { type: "number" },
                    completion_tokens: { type: "number" },
                    total_tokens: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized - Invalid or missing authentication",
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
        description: "Chat not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Chat not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  streamChat: {
    summary: "AI SDK compatible chat streaming",
    description: "AI SDK compatible chat streaming endpoint",
    tags: ["AI"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["chatId", "messages"],
            properties: {
              chatId: { type: "string" },
              messages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    role: { type: "string" },
                    content: { type: "string" },
                  },
                },
              },
              model: { type: "string", default: "gpt-4o" },
              provider: { type: "string" },
              system: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      "200": { description: "Streaming response" },
      "401": { description: "Unauthorized" },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  imageGeneration: {
    summary: "AI image generation",
    description:
      "AI SDK compatible image generation endpoint with streaming support",
    tags: ["AI"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["prompt"],
            properties: {
              prompt: { type: "string" },
              model: {
                type: "string",
                default: "google/gemini-2.5-flash-image",
              },
              provider: { type: "string" },
              n: { type: "number", default: 1 },
              stream: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    responses: {
      "200": { description: "Image generation response" },
      "401": { description: "Unauthorized" },
    },
  } satisfies OpenAPIV3_1.OperationObject,
};
