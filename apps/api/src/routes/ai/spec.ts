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
            required: ["chatId", "messages"],
            properties: {
              chatId: {
                type: "string",
                description: "Chat session identifier",
              },
              messages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    role: {
                      type: "string",
                      enum: ["system", "user", "assistant"],
                    },
                    content: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
              model: {
                type: "string",
                default: "gpt-4o",
                description: "Model identifier",
              },
              provider: {
                type: "string",
                description: "Provider name",
              },
              temperature: {
                type: "number",
                default: 0.7,
                description: "Sampling temperature",
              },
              max_tokens: {
                type: "number",
                description: "Maximum tokens",
              },
              stream: {
                type: "boolean",
                default: false,
                description: "Stream response",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Chat completion response",
      },
      "401": {
        description: "Unauthorized",
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
