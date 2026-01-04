import {
  eq,
  db,
  ragDocument,
  project,
  and,
  RAGSettingsSchema,
  credential,
  desc,
  type RAGSettings,
} from "@gaia/db";
import { RagDocumentSchema, createRagDocumentSchema, count } from "@gaia/db";
import { z } from "zod";
import { os } from "@orpc/server";
import type { AppContext } from "../types";
import { extractCredentials, validateRequiredCredentials } from "../rag-utils";
import {
  createVectorStore,
  validateVectorstore,
  type VectorStoreProviderId,
} from "@gaia/ai/vectorstores";
import type { FullTextSearchProviderId } from "@gaia/ai/vectorstores";
import { v4 as uuidv4 } from "uuid";
import { FlexSearchFullTextSearch } from "@gaia/ai/fulltext";
/**
 * Get vector store instance with all necessary credentials and settings
 */
async function getVectorStore({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  // Load project
  const [projectData] = await db
    .select()
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1);

  if (!projectData) {
    throw new Error("Project not found");
  }

  // Load and validate credentials
  const userCredentials = await db
    .select()
    .from(credential)
    .where(eq(credential.userId, userId));

  const creds = extractCredentials(userCredentials, projectData);
  const validation = validateRequiredCredentials(projectData, creds);

  if (!validation.valid) {
    throw new Error(`Missing credentials: ${validation.missing.join(", ")}`);
  }

  if (!creds?.embedding) {
    throw new Error("No embedding credentials found for project");
  }
  if (!creds?.vectorStore) {
    throw new Error("No vector store credentials found for project");
  }

  // Create and return vector store with FTS configuration
  const vectorStore = await createVectorStore({
    projectId,
    embeddingApiKey: creds.embedding.apiKey,
    embeddingModel: projectData.embeddingModel,
    embeddingBaseURL: creds.embedding.baseURL,
    provider: projectData.vectorStore,
    chunkingMethod: projectData.chunkingMethod,
    chunkSize: projectData.chunkSize,
    chunkOverlap: projectData.chunkOverlap,
    searchType: projectData.searchType,
    topK: projectData.topK,
    // Pass FTS configuration
    fullTextSearchTool: projectData.fullTextSearch as FullTextSearchProviderId,
    ftsConfig: projectData.ftsConfig || {},
    providerConfig: {
      ...creds.vectorStore.config,
      apiKey: creds.vectorStore.apiKey,
    },
  });

  return { vectorStore, projectData, creds };
}

function chunkText(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - chunkOverlap;
  }

  return chunks;
}

export const createAndIndexDocument = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/document/create-and-index",
    summary: "Create and index document",
    tags: ["RAG"],
  })
  .input(
    createRagDocumentSchema.extend({
      projectId: z.string(),
      fileId: z.string().optional(),
    })
  )
  .output(
    z.object({
      status: z.enum(["processing", "completed", "failed"]),
      message: z.string(),
      documentId: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { status: "failed", message: "Unauthorized" };
    }

    let documentId: string | undefined;
    let tempIds: string[] = [];

    const { vectorStore, projectData } = await getVectorStore({
      projectId: input.projectId,
      userId: context.session.user.id,
    });
    try {
      // Chunk the content
      const chunkSize = projectData.chunkSize || 1000;
      const chunkOverlap = projectData.chunkOverlap || 200;
      const chunks = chunkText(input.content!, chunkSize, chunkOverlap);

      // Create document record in DB FIRST to get real ID
      const [doc] = await db
        .insert(ragDocument)
        .values({
          projectId: input.projectId,
          fileId: input.fileId || `${input.sourceType}-${Date.now()}`,
          fileName: input.fileName,
          fileType: input.fileType,
          sourceType: input.sourceType,
          totalChunks: chunks.length,
          status: "processing",
          content: input.content,
        })
        .returning();

      if (!doc) {
        return {
          status: "failed",
          message: "Failed to create document record",
        };
      }

      documentId = doc.id;

      // Generate UUIDs for points
      const ids = chunks.map(() => uuidv4());
      tempIds = ids;

      // Prepare chunk metadata with real document ID
      const metadatas = chunks.map((_, i) => ({
        documentId: doc.id,
        fileName: input.fileName,
        chunkIndex: i,
        totalChunks: chunks.length,
        sourceType: input.sourceType,
      }));

      await vectorStore.addTexts(chunks, metadatas, ids);

      // Update document status to completed
      await db
        .update(ragDocument)
        .set({
          status: "completed",
        })
        .where(eq(ragDocument.id, doc.id));

      // Update project total documents
      await db
        .update(project)
        .set({
          totalDocuments: projectData.totalDocuments + 1,
          updatedAt: new Date(),
        })
        .where(eq(project.id, input.projectId));

      return {
        status: "completed",
        message: `Document indexed successfully with ${chunks.length} chunks`,
        documentId: doc.id,
      };
    } catch (error) {
      console.error("Failed to index document:", error);

      // Cleanup on error
      if (documentId) {
        try {
          // Delete from vector store if IDs were generated
          if (tempIds.length > 0) {
            await vectorStore?.delete(tempIds);
          }

          // Mark document as failed instead of deleting
          await db
            .update(ragDocument)
            .set({
              status: "failed",
            })
            .where(eq(ragDocument.id, documentId));
        } catch (cleanupError) {
          console.error("Failed to cleanup document:", cleanupError);
        }
      }

      return {
        status: "failed",
        message: error instanceof Error ? error.message : "Indexing failed",
      };
    }
  });

export const validateVectorstoreConfig = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/validate-api-key",
    summary: "Validate API Key",
    tags: ["RAG"],
  })
  .input(
    z.object({
      vectorstoreProvider: z.string(),
      vectorStoreConfig: z.record(z.string(), z.any()),
    })
  )
  .output(
    z.object({
      isValid: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { isValid: false, message: "Unauthorized" };
    }

    try {
      const isValid = await validateVectorstore({
        provider: input.vectorstoreProvider as VectorStoreProviderId,
        config: input.vectorStoreConfig!,
      });

      if (isValid instanceof Error) {
        return {
          isValid: false,
          message: isValid.message,
        };
      }

      return {
        isValid: isValid || false,
        message: isValid ? "API Key is valid" : "API Key is invalid",
      };
    } catch (error) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : "Validation failed",
      };
    }
  });

export const searchDocuments = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/document/search",
    summary: "Search documents",
    tags: ["RAG"],
  })
  .input(
    z.object({
      query: z.string(),
      projectId: z.string(),
      topK: z.number().default(5).optional(),
      minScore: z.number().default(0.5).optional(),
      searchType: z.enum(["semantic", "mrr", "hybrid"]).optional(),
      alpha: z.number().min(0).max(1).optional(), // For hybrid search
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      documents: z.array(
        z.object({
          content: z.string(),
          metadata: z.record(z.string(), z.any()),
          score: z.number(),
        })
      ),
      message: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    try {
      if (!context.session?.user) {
        return {
          success: false,
          documents: [],
          message: "Unauthorized",
        };
      }

      const { vectorStore, projectData } = await getVectorStore({
        projectId: input.projectId,
        userId: context.session.user.id,
      });

      const topK = input.topK || projectData.topK || 5;
      const minScore = input.minScore || 0;
      const searchType = input.searchType || projectData.searchType || "hybrid";

      let results;

      // Execute search based on type
      if (searchType === "hybrid") {
        results = await vectorStore.hybridSearch(input.query, {
          topK,
          minScore,
          alpha: input.alpha ?? 0.5,
        });
      } else if (searchType === "mmr" || searchType === "similarity") {
        results = await vectorStore.fullTextSearch(input.query, {
          topK,
          minScore,
        });
      } else {
        // Default semantic/vector search
        results = await vectorStore.search(input.query, {
          topK,
          minScore,
        });
      }

      return {
        success: true,
        documents: results,
      };
    } catch (error) {
      console.error("RAG search error:", error);
      return {
        success: false,
        documents: [],
        message: error instanceof Error ? error.message : "Search failed",
      };
    }
  });

// ... (rest of the router methods remain the same)

export const getRagDocuments = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/rag/document/list",
    summary: "List RAG documents for project",
    tags: ["RAG"],
  })
  .input(
    z.object({
      projectId: z.string(),
      status: z
        .enum(["pending", "processing", "completed", "failed"])
        .optional(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      documents: z.array(RagDocumentSchema),
      total: z.number(),
      hasMore: z.boolean(),
      nextOffset: z.number().optional(),
      message: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return {
        success: false,
        documents: [],
        total: 0,
        hasMore: false,
        message: "Unauthorized",
      };
    }

    const { projectId, status, limit, offset } = input;

    const conditions = [
      eq(ragDocument.projectId, projectId),
      status ? eq(ragDocument.status, status) : undefined,
    ].filter(Boolean) as any[];

    const whereClause = and(...conditions);

    const [docs, totalCount] = await Promise.all([
      db
        .select()
        .from(ragDocument)
        .where(whereClause)
        .limit(limit + 1)
        .offset(offset)
        .orderBy(desc(ragDocument.createdAt)),
      db.select({ count: count() }).from(ragDocument).where(whereClause),
    ]);

    const hasMore = docs.length > limit;
    const documentsToReturn = hasMore ? docs.slice(0, limit) : docs;

    return {
      success: true,
      documents: documentsToReturn,
      total: Number(totalCount[0]?.count ?? 0),
      hasMore,
      nextOffset: hasMore ? offset + limit : undefined,
    };
  });

export const deleteRagDocument = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/rag/document/:id",
    summary: "Delete RAG document and its vectors",
    tags: ["RAG"],
  })
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean(), message: z.string().optional() }))
  .handler(async ({ input, context }) => {
    try {
      if (!context.session?.user) {
        return { success: false, message: "Unauthorized" };
      }
      const [doc] = await db
        .select()
        .from(ragDocument)
        .where(eq(ragDocument.id, input.id))
        .limit(1);

      if (!doc) {
        return { success: false, message: "Document not found" };
      }

      const { vectorStore, projectData } = await getVectorStore({
        projectId: doc.projectId,
        userId: context.session.user.id,
      });

      // Delete from vector store FIRST (this will also delete from FTS if configured)
      const chunkIds = Array.from(
        { length: doc.totalChunks },
        (_, i) => `${doc.id}-chunk-${i}`
      );

      await vectorStore.delete(chunkIds, doc.id);

      // Delete from database
      await db.delete(ragDocument).where(eq(ragDocument.id, input.id));

      // Update project total documents count
      await db
        .update(project)
        .set({
          totalDocuments: Math.max(0, projectData.totalDocuments - 1),
          updatedAt: new Date(),
        })
        .where(eq(project.id, doc.projectId));

      return { success: true, message: "Document deleted successfully" };
    } catch (error) {
      console.error("Delete document error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete document",
      };
    }
  });

export const getRagDocument = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/rag/document/:id",
    summary: "Get single RAG document",
    tags: ["RAG"],
  })
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      success: z.boolean(),
      document: RagDocumentSchema.nullable(),
    })
  )
  .handler(async ({ input }) => {
    const [doc] = await db
      .select()
      .from(ragDocument)
      .where(eq(ragDocument.id, input.id))
      .limit(1);

    return { success: true, document: doc ?? null };
  });

export const getRAGSettings = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/rag/settings",
    summary: "Get RAG settings",
    tags: ["RAG"],
  })
  .input(z.object({ projectId: z.string() }))
  .output(
    z.object({
      success: z.boolean(),
      settings: RAGSettingsSchema.nullable(),
      message: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, settings: null, message: "Unauthorized" };
    }

    const [projectData] = await db
      .select()
      .from(project)
      .where(eq(project.id, input.projectId))
      .limit(1);

    if (!projectData) {
      return { success: false, settings: null, message: "Project not found" };
    }

    const settings: RAGSettings = {
      chunkingMethod: projectData.chunkingMethod,
      chunkSize: projectData.chunkSize,
      chunkOverlap: projectData.chunkOverlap,
      llmProvider: projectData.llmProvider,
      llmModel: projectData.llmModel,
      embeddingProvider: projectData.embeddingProvider,
      embeddingModel: projectData.embeddingModel,
      vectorStore: projectData.vectorStore,
      searchType: projectData.searchType,
      topK: projectData.topK,
      reranker: projectData.reranker,
      useReranker: projectData.useReranker,
      temperature: projectData.temperature,
      maxTokens: projectData.maxTokens,
      ftsConfig: projectData.ftsConfig || {},
      fullTextSearchTool: projectData.fullTextSearch || "flexsearch",
      vectorStoreConfig: projectData.vectorStoreConfig || {},
      embeddingDimensions: projectData.embeddingDimensions!,
      llmConfig: projectData.llmConfig || {},
    };

    return { success: true, settings };
  });

export const updateRAGSettings = os
  .$context<AppContext>()
  .route({
    method: "PATCH",
    path: "/rag/settings",
    summary: "Update RAG settings",
    tags: ["RAG"],
  })
  .input(
    z.object({
      projectId: z.string(),
      settings: RAGSettingsSchema,
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    try {
      await db
        .update(project)
        .set({
          ...input.settings,
          fullTextSearch: input.settings.fullTextSearchTool,
          ftsConfig: input.settings.ftsConfig,
          vectorStoreConfig: input.settings.vectorStoreConfig,
          llmConfig: input.settings.llmConfig,
        })
        .where(eq(project.id, input.projectId));

      return { success: true, message: "Settings updated successfully" };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update settings",
      };
    }
  });

export const RagRouter = os.$context<AppContext>().router({
  createAndIndexDocument,
  getRagDocuments,
  getRagDocument,
  deleteRagDocument,
  searchDocuments,
  getRAGSettings,
  updateRAGSettings,
  validateVectorstoreConfig,
});
