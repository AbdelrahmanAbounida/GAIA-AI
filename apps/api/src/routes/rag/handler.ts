import type { AppContext } from "../../types";
import { ragSchemas } from "./schema";
import type z from "zod";
import {
  eq,
  db,
  ragDocument,
  project,
  and,
  credential,
  desc,
  count,
} from "@gaia/db";
import { createVectorStore, validateVectorstore } from "@gaia/ai/vectorstores";
import type { VectorStoreProviderId, FullTextSearchProviderId } from "@gaia/ai";
import { v4 as uuidv4 } from "uuid";
import {
  extractCredentials,
  validateRequiredCredentials,
} from "../../rag-utils";

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
  const [projectData] = await db
    .select()
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1);

  if (!projectData) {
    throw new Error("Project not found");
  }

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

export const ragHandlers = {
  createAndIndexDocument: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.createAndIndexDocumentInput>;
  }): Promise<z.infer<typeof ragSchemas.createAndIndexDocumentOutput>> => {
    if (!context.session?.user) {
      return { status: "failed", message: "Unauthorized" };
    }

    let documentId: string | undefined;
    let tempIds: string[] = [];

    try {
      const { vectorStore, projectData } = await getVectorStore({
        projectId: input.projectId,
        userId: context.session.user.id,
      });

      const chunkSize = projectData.chunkSize || 1000;
      const chunkOverlap = projectData.chunkOverlap || 200;
      const chunks = chunkText(input.content!, chunkSize, chunkOverlap);

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

      const ids = chunks.map(() => uuidv4());
      tempIds = ids;

      const metadatas = chunks.map((_, i) => ({
        documentId: doc.id,
        fileName: input.fileName,
        chunkIndex: i,
        totalChunks: chunks.length,
        sourceType: input.sourceType,
      }));

      await vectorStore.addTexts(chunks, metadatas, ids);

      await db
        .update(ragDocument)
        .set({ status: "completed" })
        .where(eq(ragDocument.id, doc.id));

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

      if (documentId) {
        try {
          const { vectorStore } = await getVectorStore({
            projectId: input.projectId,
            userId: context.session.user.id,
          });

          if (tempIds.length > 0) {
            await vectorStore?.delete(tempIds);
          }

          await db
            .update(ragDocument)
            .set({ status: "failed" })
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
  },

  createAndIndexDocumentStreaming: async function* ({
    context,
    input,
    signal,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.createAndIndexDocumentInput>;
    signal?: AbortSignal;
  }) {
    if (!context.session?.user) {
      yield { type: "error" as const, message: "Unauthorized" };
      return;
    }

    let documentId: string | undefined;
    let tempIds: string[] = [];

    try {
      const { vectorStore, projectData } = await getVectorStore({
        projectId: input.projectId,
        userId: context.session.user.id,
      });

      const chunkSize = projectData.chunkSize || 1000;
      const chunkOverlap = projectData.chunkOverlap || 200;
      const chunks = chunkText(input.content!, chunkSize, chunkOverlap);

      yield {
        type: "progress" as const,
        progress: 5,
        message: "Creating document record...",
        totalChunks: chunks.length,
      };

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
        yield {
          type: "error" as const,
          message: "Failed to create document record",
        };
        return;
      }

      documentId = doc.id;

      yield {
        type: "progress" as const,
        progress: 10,
        message: "Document record created. Starting indexing...",
        totalChunks: chunks.length,
      };

      const ids = chunks.map(() => uuidv4());
      tempIds = ids;

      const metadatas = chunks.map((_, i) => ({
        documentId: doc.id,
        fileName: input.fileName,
        chunkIndex: i,
        totalChunks: chunks.length,
        sourceType: input.sourceType,
      }));

      const batchSize = Math.floor(0.25 * chunks.length) || 1;
      for (let i = 0; i < chunks.length; i += batchSize) {
        if (signal?.aborted) {
          yield {
            type: "cancelled" as const,
            message: "Indexing cancelled by user",
          };

          if (tempIds.length > 0) {
            await vectorStore.delete(tempIds.slice(0, i));
          }
          await db
            .update(ragDocument)
            .set({ status: "failed" })
            .where(eq(ragDocument.id, doc.id));

          return;
        }

        const batchEnd = Math.min(i + batchSize, chunks.length);
        const batchChunks = chunks.slice(i, batchEnd);
        const batchMetadata = metadatas.slice(i, batchEnd);
        const batchIds = ids.slice(i, batchEnd);

        await vectorStore.addTexts(batchChunks, batchMetadata, batchIds);

        const progress = 10 + Math.floor((batchEnd / chunks.length) * 80);

        yield {
          type: "progress" as const,
          progress,
          message: `Indexed ${batchEnd} of ${chunks.length} chunks`,
          currentChunk: batchEnd,
          totalChunks: chunks.length,
        };

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await db
        .update(ragDocument)
        .set({ status: "completed" })
        .where(eq(ragDocument.id, doc.id));

      await db
        .update(project)
        .set({
          totalDocuments: projectData.totalDocuments + 1,
          updatedAt: new Date(),
        })
        .where(eq(project.id, input.projectId));

      yield {
        type: "progress" as const,
        progress: 95,
        message: "Finalizing...",
        totalChunks: chunks.length,
      };

      yield {
        type: "completed" as const,
        documentId: doc.id,
        message: `Document indexed successfully`,
        totalChunks: chunks.length,
      };
    } catch (error) {
      console.error("Failed to index document:", error);

      try {
        const { vectorStore } = await getVectorStore({
          projectId: input.projectId,
          userId: context.session.user.id,
        });

        if (documentId) {
          try {
            if (tempIds.length > 0) {
              await vectorStore?.delete(tempIds);
            }
            await db
              .update(ragDocument)
              .set({ status: "failed" })
              .where(eq(ragDocument.id, documentId));
          } catch (cleanupError) {
            console.error("Failed to cleanup document:", cleanupError);
          }
        }

        yield {
          type: "error" as const,
          message: error instanceof Error ? error.message : "Indexing failed",
          error: error instanceof Error ? error.stack : undefined,
        };
      } catch (err) {
        yield {
          type: "error" as const,
          message: err instanceof Error ? err.message : "Indexing failed",
          error: err instanceof Error ? err.stack : undefined,
        };
      }
    }
  },

  validateVectorstoreConfig: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.validateVectorstoreConfigInput>;
  }) => {
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
  },

  searchDocuments: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.searchDocumentsInput>;
  }) => {
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
  },

  getRagDocuments: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.getRagDocumentsInput>;
  }) => {
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
  },

  getRagDocument: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.getRagDocumentInput>;
  }) => {
    if (!context.session?.user) {
      return { success: false, document: null, message: "Unauthorized" };
    }

    const [doc] = await db
      .select()
      .from(ragDocument)
      .where(eq(ragDocument.id, input.id))
      .limit(1);

    return { success: true, document: doc ?? null };
  },

  deleteRagDocument: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.deleteRagDocumentInput>;
  }) => {
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

      const chunkIds = Array.from(
        { length: doc.totalChunks },
        (_, i) => `${doc.id}-chunk-${i}`
      );

      await vectorStore.delete(chunkIds, doc.id);

      await db.delete(ragDocument).where(eq(ragDocument.id, input.id));

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
  },

  getRAGSettings: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.getRAGSettingsInput>;
  }) => {
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

    const settings = {
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
  },

  updateRAGSettings: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof ragSchemas.updateRAGSettingsInput>;
  }) => {
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
  },
};
