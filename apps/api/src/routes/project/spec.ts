import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const projectSpecs = {
  getProjects: {
    summary: "Get all projects",
    description:
      "Retrieves all projects for the authenticated user with optional search and pagination",
    tags: ["Projects"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "searchWord",
        in: "query",
        description: "Search term for filtering projects by name",
        schema: { type: "string" },
      },
      {
        name: "limit",
        in: "query",
        description: "Number of results per page",
        schema: { type: "number", default: 20 },
      },
      {
        name: "cursor",
        in: "query",
        description: "Pagination cursor",
        schema: { type: "string", default: "" },
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
        description: "Projects retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                projects: {
                  type: "array",
                  items: { type: "object" },
                },
                nextCursor: { type: "string" },
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
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getProject: {
    summary: "Get a project",
    description:
      "Retrieves a specific project by ID for the authenticated user",
    tags: ["Projects"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "path",
        required: true,
        description: "Project ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Project retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                project: { type: "object" },
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

  createProject: {
    summary: "Create a new project",
    description: "Creates a new project for the authenticated user",
    tags: ["Projects"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: {
                type: "string",
                description: "Project name",
              },
              description: {
                type: "string",
                description: "Project description",
              },
              icon: {
                type: "string",
                description: "Project icon",
              },
              color: {
                type: "string",
                description: "Project color",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Project created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Project created" },
                project: { type: "object" },
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

  deleteProject: {
    summary: "Delete a project",
    description: "Deletes a specific project for the authenticated user",
    tags: ["Projects"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "path",
        required: true,
        description: "Project ID to delete",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Project deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string", example: "Project deleted" },
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
};
