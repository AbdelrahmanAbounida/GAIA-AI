import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const chatSpecs = {
  // CHAT SPECS
  createChat: {
    summary: "Create a new chat",
    description: "Creates a new chat for the authenticated user",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", description: "Chat name" },
              chatId: { type: "string", description: "Optional chat ID" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Chat created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Chat created successfully",
                },
                chat: { type: "object" },
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

  listChats: {
    summary: "Get all chats for user",
    description:
      "Retrieves all chats for the authenticated user with pagination",
    tags: ["Chats"],
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
        description: "Chats retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                chats: { type: "array", items: { type: "object" } },
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
                chats: { type: "array", items: {} },
                hasMore: { type: "boolean", example: false },
                total: { type: "number", example: 0 },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getChat: {
    summary: "Get a specific chat",
    description: "Retrieves a specific chat by ID for the authenticated user",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Chat ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Chat retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                chat: { type: "object" },
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

  updateChat: {
    summary: "Update a chat",
    description: "Updates a specific chat for the authenticated user",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Chat ID",
        schema: { type: "string" },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", description: "Updated chat name" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Chat updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Chat updated successfully",
                },
                chat: { type: "object" },
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

  deleteChat: {
    summary: "Delete a chat",
    description:
      "Deletes a specific chat and all associated data for the authenticated user",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Chat ID to delete",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Chat deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Chat deleted successfully",
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

  // MESSAGE SPECS
  createMessage: {
    summary: "Create a message in a chat",
    description: "Creates a new message in a specific chat",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "chatId",
        in: "path",
        required: true,
        description: "Chat ID",
        schema: { type: "string" },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["chatId", "role", "parts"],
            properties: {
              id: {
                type: "string",
              },
              chatId: {
                type: "string",
              },
              role: {
                type: "string",
              },
              parts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    text: { type: "string" },
                  },
                  required: ["type"],
                },
              },
              attachments: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              metadata: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
      },
    },

    responses: {
      "200": {
        description: "Message created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Message created successfully",
                },
                data: { type: "object" },
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

  listMessages: {
    summary: "Get all messages in a chat",
    description: "Retrieves all messages in a specific chat",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "chatId",
        in: "path",
        required: true,
        description: "Chat ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Messages retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                messages: { type: "array", items: { type: "object" } },
                message: {
                  type: "string",
                  example: "Messages fetched successfully",
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
                messages: { type: "array", items: {} },
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
                messages: { type: "array", items: {} },
                message: { type: "string", example: "Chat not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deleteMessage: {
    summary: "Delete a message",
    description: "Deletes a specific message from a chat",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "chatId",
        in: "path",
        required: true,
        description: "Chat ID",
        schema: { type: "string" },
      },
      {
        name: "messageId",
        in: "path",
        required: true,
        description: "Message ID to delete",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Message deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Message deleted successfully",
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
        description: "Chat or message not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Message not found" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  // VOTE SPECS
  createVote: {
    summary: "Create or update a vote",
    description: "Creates a new vote or updates an existing vote on a message",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "chatId",
        in: "path",
        required: true,
        description: "Chat ID",
        schema: { type: "string" },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["chatId", "messageId", "isUpvoted"],
            properties: {
              chatId: { type: "string" },
              messageId: { type: "string" },
              isUpvoted: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Vote created or updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" },
                vote: { type: "object" },
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

  listVotes: {
    summary: "Get votes for a chat",
    description: "Retrieves all votes for a specific chat",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "chatId",
        in: "path",
        required: true,
        description: "Chat ID",
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Votes retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                votes: { type: "array", items: { type: "object" } },
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
                votes: { type: "array", items: {} },
                message: { type: "string", example: "Unauthorized" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  // STREAM SPECS
  createStream: {
    summary: "Create a stream for a chat",
    description: "Creates a new stream for a specific chat",
    tags: ["Chats"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "chatId",
        in: "path",
        required: true,
        description: "Chat ID",
        schema: { type: "string" },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["chatId"],
            properties: {
              chatId: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Stream created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: {
                  type: "string",
                  example: "Stream created successfully",
                },
                stream: { type: "object" },
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
};
