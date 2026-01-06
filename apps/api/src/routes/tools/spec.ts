import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const toolSpecs = {
  createTool: {
    summary: "Create a new tool",
    description: "Creates a new tool for a project",
    tags: ["Tools"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: [
              "projectId",
              "name",
              "description",
              "language",
              "dependencies",
              "code",
            ],
            properties: {
              projectId: { type: "string", description: "Project ID" },
              name: { type: "string", description: "Tool name" },
              description: { type: "string", description: "Tool description" },
              language: {
                type: "string",
                enum: ["javascript", "python"],
                description: "Programming language",
              },
              dependencies: {
                type: "array",
                items: { type: "string" },
                description: "List of dependencies",
              },
              code: { type: "string", description: "Tool code" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Tool created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Tool created successfully",
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

  listTools: {
    summary: "List all tools",
    description: "Retrieves all tools for a project with pagination",
    tags: ["Tools"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "query",
        required: true,
        description: "Project ID",
        schema: { type: "string" },
      },
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
        description: "Tools retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                tools: {
                  type: "array",
                  items: { type: "object" },
                },
                total: { type: "number" },
                hasMore: { type: "boolean" },
                nextOffset: { type: "number" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getTool: {
    summary: "Get a tool",
    description: "Retrieves a specific tool by ID",
    tags: ["Tools"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Tool ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Tool retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                tool: { type: ["object", "null"] },
                message: { type: "string" },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
      "404": {
        description: "Tool not found",
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  updateTool: {
    summary: "Update a tool",
    description: "Updates an existing tool",
    tags: ["Tools"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Tool ID",
        schema: { type: "string" },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["toolId", "tool"],
            properties: {
              toolId: { type: "string", description: "Tool ID" },
              tool: {
                type: "object",
                description: "Tool fields to update",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Tool updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Tool updated successfully",
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deleteTool: {
    summary: "Delete a tool",
    description: "Deletes a specific tool",
    tags: ["Tools"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Tool ID to delete",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Tool deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Tool deleted successfully",
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
      "404": {
        description: "Tool not found",
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  triggerToolActivation: {
    summary: "Activate or deactivate a tool",
    description: "Toggles the enabled state of a tool",
    tags: ["Tools"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Tool ID",
        schema: { type: "string" },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["toolId", "activeState"],
            properties: {
              toolId: { type: "string", description: "Tool ID" },
              activeState: {
                type: "boolean",
                description: "Active state to set",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Tool activation updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Tool activation updated successfully",
                },
              },
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,
};
