import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const apiKeySpecs = {
  createApiKey: {
    summary: "Create a new API key",
    description: "Creates a new API key for a specific project",
    tags: ["ApiKeys"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "value", "projectId"],
            properties: {
              name: {
                type: "string",
                minLength: 1,
                maxLength: 255,
                description: "API key name",
              },
              value: {
                type: "string",
                minLength: 1,
                description: "API key value",
              },
              projectId: {
                type: "string",
                description: "Project ID this API key belongs to",
              },
              expiresAt: {
                type: "string",
                format: "date-time",
                description: "Optional expiration date",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "API key created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "API key created successfully",
                },
                apiKey: { type: "object" },
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
        description: "Project not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Project not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deleteApiKey: {
    summary: "Delete an API key",
    description: "Deletes a specific API key for the authenticated user",
    tags: ["ApiKeys"],
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
                format: "uuid",
                description: "API key ID to delete",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "API key deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "API key deleted successfully",
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
        description: "API key not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: {
                  type: "string",
                  example: "API key not found or unauthorized",
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getApiKeys: {
    summary: "Get all API keys for the current user",
    description:
      "Retrieves all API keys for the authenticated user with masked values",
    tags: ["ApiKeys"],
    security: [{ Bearer: [] }],
    responses: {
      "200": {
        description: "API keys retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                apiKeys: {
                  type: "array",
                  items: { type: "object" },
                  description: "List of API keys with masked values",
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
                apiKeys: { type: "array", items: {} },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getApiKey: {
    summary: "Get a specific API key",
    description:
      "Retrieves a specific API key by ID for the authenticated user",
    tags: ["ApiKeys"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "API key ID",
        schema: { type: "string", format: "uuid" },
      },
    ],
    responses: {
      "200": {
        description: "API key retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "API key retrieved successfully",
                },
                apiKey: { type: "object" },
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
        description: "API key not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "API key not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,
};
