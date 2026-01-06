import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const promptSpecs = {
  getPrompt: {
    summary: "Get prompt for a project",
    description: "Retrieves the prompt associated with a specific project",
    tags: ["Prompt"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "path" as const,
        description: "The unique identifier of the project",
        required: true,
        schema: {
          type: "string" as const,
        },
      },
    ],
    responses: {
      200: {
        description: "Prompt retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  description: "Indicates if the operation was successful",
                  example: true,
                },
                prompt: {
                  type: "object" as const,
                  description: "The prompt object",
                  properties: {
                    id: {
                      type: "string" as const,
                      description: "Unique identifier of the prompt",
                    },
                    projectId: {
                      type: "string" as const,
                      description: "The project identifier",
                    },
                    content: {
                      type: "string" as const,
                      description: "The prompt content",
                    },
                    createdAt: {
                      type: "string" as const,
                      format: "date-time",
                      description: "Creation timestamp",
                    },
                    updatedAt: {
                      type: "string" as const,
                      format: "date-time",
                      description: "Last update timestamp",
                    },
                  },
                },
                message: {
                  type: "string" as const,
                  description: "Additional message or error information",
                },
              },
            },
          },
        },
      },
      401: {
        description: "Unauthorized - User not authenticated",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  example: false,
                },
                message: {
                  type: "string" as const,
                  example: "Unauthorized",
                },
              },
            },
          },
        },
      },
    },
  },

  createPrompt: {
    summary: "Create a new prompt",
    description: "Creates a new prompt for a specific project",
    tags: ["Prompt"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      description: "Prompt creation data",
      content: {
        "application/json": {
          schema: {
            type: "object" as const,
            required: ["projectId", "prompt"],
            properties: {
              projectId: {
                type: "string" as const,
                description: "The unique identifier of the project",
                example: "proj_123abc",
              },
              prompt: {
                type: "string" as const,
                description: "The prompt content to be created",
                example: "You are a helpful AI assistant...",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Prompt created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  description: "Indicates if the operation was successful",
                  example: true,
                },
                message: {
                  type: "string" as const,
                  description: "Success message",
                  example: "Prompt created successfully",
                },
              },
            },
          },
        },
      },
      400: {
        description: "Bad Request - Prompt already exists",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  example: false,
                },
                message: {
                  type: "string" as const,
                  example: "Prompt already exists",
                },
              },
            },
          },
        },
      },
      401: {
        description: "Unauthorized - User not authenticated",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  example: false,
                },
                message: {
                  type: "string" as const,
                  example: "Unauthorized",
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  updatePrompt: {
    summary: "Update a prompt",
    description:
      "Updates an existing prompt or creates one if it doesn't exist (upsert operation)",
    tags: ["Prompt"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "path" as const,
        description: "The unique identifier of the project",
        required: true,
        schema: {
          type: "string" as const,
        },
      },
    ],
    requestBody: {
      required: true,
      description: "Updated prompt content",
      content: {
        "application/json": {
          schema: {
            type: "object" as const,
            required: ["prompt"],
            properties: {
              prompt: {
                type: "string" as const,
                description: "The updated prompt content",
                example: "You are a helpful AI assistant with expertise in...",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Prompt updated or created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  description: "Indicates if the operation was successful",
                  example: true,
                },
                message: {
                  type: "string" as const,
                  description: "Success message",
                  example: "Prompt updated successfully",
                },
              },
            },
          },
        },
      },
      401: {
        description: "Unauthorized - User not authenticated",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  example: false,
                },
                message: {
                  type: "string" as const,
                  example: "Unauthorized",
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deletePrompt: {
    summary: "Delete a prompt",
    description: "Deletes the prompt associated with a specific project",
    tags: ["Prompt"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "path" as const,
        description: "The unique identifier of the project",
        required: true,
        schema: {
          type: "string" as const,
        },
      },
    ],
    responses: {
      200: {
        description: "Prompt deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  description: "Indicates if the operation was successful",
                  example: true,
                },
                message: {
                  type: "string" as const,
                  description: "Success message",
                  example: "Prompt deleted successfully",
                },
              },
            },
          },
        },
      },
      401: {
        description: "Unauthorized - User not authenticated",
        content: {
          "application/json": {
            schema: {
              type: "object" as const,
              properties: {
                success: {
                  type: "boolean" as const,
                  example: false,
                },
                message: {
                  type: "string" as const,
                  example: "Unauthorized",
                },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,
};
