import type { OpenAPI as OpenAPIV3_1 } from "@orpc/openapi";

export const ragSpecs = {
  createAndIndexDocument: {
    summary: "Create and index document",
    description: "Creates a new document and indexes it in the vector store",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: [
              "projectId",
              "fileName",
              "fileType",
              "sourceType",
              "content",
            ],
            properties: {
              projectId: { type: "string" },
              fileId: { type: "string" },
              fileName: { type: "string" },
              fileType: { type: "string" },
              sourceType: { type: "string" },
              content: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Document indexed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["processing", "completed", "failed"],
                },
                message: { type: "string" },
                documentId: { type: "string" },
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

  createAndIndexDocumentStreaming: {
    summary: "Create and index document with streaming",
    description:
      "Creates and indexes a document with real-time progress updates",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: [
              "projectId",
              "fileName",
              "fileType",
              "sourceType",
              "content",
            ],
            properties: {
              projectId: { type: "string" },
              fileId: { type: "string" },
              fileName: { type: "string" },
              fileType: { type: "string" },
              sourceType: { type: "string" },
              content: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Streaming indexing progress",
        content: {
          "text/event-stream": {
            schema: {
              type: "object",
              properties: {
                type: { type: "string" },
                progress: { type: "number" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  validateVectorstoreConfig: {
    summary: "Validate vectorstore configuration",
    description: "Validates vector store API key and configuration",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["vectorstoreProvider", "vectorStoreConfig"],
            properties: {
              vectorstoreProvider: { type: "string" },
              vectorStoreConfig: { type: "object" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Validation result",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                isValid: { type: "boolean" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  searchDocuments: {
    summary: "Search documents",
    description: "Searches indexed documents using vector similarity",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query", "projectId"],
            properties: {
              query: { type: "string" },
              projectId: { type: "string" },
              topK: { type: "number", default: 5 },
              minScore: { type: "number", default: 0.5 },
              searchType: {
                type: "string",
                enum: ["semantic", "mrr", "hybrid"],
              },
              alpha: { type: "number", minimum: 0, maximum: 1 },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Search results",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                documents: { type: "array", items: { type: "object" } },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getRagDocuments: {
    summary: "List RAG documents",
    description: "Retrieves all documents for a project with pagination",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "query",
        required: true,
        schema: { type: "string" },
      },
      {
        name: "status",
        in: "query",
        schema: {
          type: "string",
          enum: ["pending", "processing", "completed", "failed"],
        },
      },
      {
        name: "limit",
        in: "query",
        schema: { type: "number", default: 20 },
      },
      {
        name: "offset",
        in: "query",
        schema: { type: "number", default: 0 },
      },
    ],
    responses: {
      "200": {
        description: "Documents retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                documents: { type: "array", items: { type: "object" } },
                total: { type: "number" },
                hasMore: { type: "boolean" },
                nextOffset: { type: "number" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getRagDocument: {
    summary: "Get single document",
    description: "Retrieves a specific document by ID",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Document retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                document: { type: ["object", "null"] },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  deleteRagDocument: {
    summary: "Delete document",
    description: "Deletes a document and its vectors from the store",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Document deleted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  getRAGSettings: {
    summary: "Get RAG settings",
    description: "Retrieves RAG configuration settings for a project",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    parameters: [
      {
        name: "projectId",
        in: "query",
        required: true,
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": {
        description: "Settings retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                settings: { type: ["object", "null"] },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,

  updateRAGSettings: {
    summary: "Update RAG settings",
    description: "Updates RAG configuration settings for a project",
    tags: ["Knowledge"],
    security: [{ Bearer: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["projectId", "settings"],
            properties: {
              projectId: { type: "string" },
              settings: { type: "object" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Settings updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  } satisfies OpenAPIV3_1.OperationObject,
};
