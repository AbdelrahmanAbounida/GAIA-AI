import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const credentialSpecs = {
  createCredential: {
    summary: "Create a new credential",
    description:
      "Creates a new credential for AI providers. For Ollama, it manages models within a single credential.",
    tags: ["Credentials"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["provider", "apiKey", "credentialType"],
            properties: {
              name: {
                type: "string",
                description: "Credential name or model name for Ollama",
              },
              provider: {
                type: "string",
                description: "Provider name (e.g., openai, anthropic, ollama)",
              },
              apiKey: {
                type: "string",
                description: "API key for the provider",
              },
              credentialType: {
                type: "string",
                description: "Type of credential",
              },
              baseUrl: {
                type: ["string", "null"],
                description: "Optional base URL for the provider",
              },
              dynamicFields: {
                type: "object",
                description: "Additional dynamic fields",
              },
              proxy: {
                type: "boolean",
                description: "Whether to use proxy",
              },
              isValid: {
                type: "boolean",
                description: "Validation status",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Credential created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Credential created successfully",
                },
                credentialId: { type: "string" },
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
        description: "Bad request - credential already exists",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: {
                  type: "string",
                  example: "Valid credential for provider already exists",
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getCredentials: {
    summary: "Get credentials for the current user (paginated)",
    description:
      "Retrieves all credentials for the authenticated user with masked API keys",
    tags: ["Credentials"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "limit",
        in: "query",
        description: "Number of results per page",
        schema: { type: "number", default: 20 },
      },
      {
        name: "offset",
        in: "query",
        description: "Pagination offset",
        schema: { type: "number", default: 0 },
      },
    ],
    responses: {
      "200": {
        description: "Credentials retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                credentials: {
                  type: "array",
                  items: { type: "object" },
                },
                nextOffset: { type: "number" },
                hasMore: { type: "boolean" },
                total: { type: "number" },
                message: { type: "string" },
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
                credentials: { type: "array", items: {} },
                total: { type: "number", example: 0 },
                hasMore: { type: "boolean", example: false },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getCredential: {
    summary: "Get a specific credential",
    description: "Retrieves a specific credential by ID with masked API key",
    tags: ["Credentials"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Credential ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Credential retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                credential: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    provider: { type: "string" },
                    baseUrl: { type: ["string", "null"] },
                    models: {
                      type: "array",
                      items: { type: ["string", "null"] },
                    },
                    isValid: { type: "boolean" },
                    lastValidatedAt: {
                      type: ["string", "null"],
                      format: "date-time",
                    },
                    createdAt: { type: "string", format: "date-time" },
                    maskedApiKey: { type: "string" },
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
        description: "Credential not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Credential not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  updateCredential: {
    summary: "Update a credential",
    description: "Updates a specific credential for the authenticated user",
    tags: ["Credentials"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Credential ID",
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
              data: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  apiKey: { type: "string" },
                  baseUrl: { type: ["string", "null"] },
                  isValid: { type: "boolean" },
                  dynamicFields: { type: "object" },
                  proxy: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Credential updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Credential updated successfully",
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
        description: "Credential not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Credential not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deleteCredential: {
    summary: "Delete a credential",
    description: "Deletes a specific credential for the authenticated user",
    tags: ["Credentials"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Credential ID to delete",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Credential deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Credential deleted successfully",
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
        description: "Credential not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Credential not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deleteModelFromCredential: {
    summary: "Delete a model from an Ollama credential",
    description:
      "Removes a specific model from an Ollama credential. Deletes the credential if no models remain.",
    tags: ["Credentials"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Credential ID",
        schema: { type: "string" },
      },
      {
        name: "modelName",
        in: "path",
        required: true,
        description: "Model name to remove",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Model removed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  examples: [
                    "Model removed successfully",
                    "Credential deleted (no models remaining)",
                  ],
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
        description: "Credential not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Credential not found" },
              },
            },
          },
        },
      },
      "400": {
        description: "Invalid operation",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: {
                  type: "string",
                  example: "This operation is only for Ollama credentials",
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,
};
