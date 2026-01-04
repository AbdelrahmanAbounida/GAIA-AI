import { os } from "@orpc/server";
import type { AppContext } from "../types";
import { z } from "zod";
import { OramaFullTextSearch } from "@gaia/ai/fulltext";
import { db, project, eq } from "@gaia/db";

export const demoFulltextAdd = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/demo-fulltext-add",
    summary: "Add documents to fulltext search",
    tags: ["RAG"],
  })
  .input(
    z.object({
      projectId: z.string(),
      documents: z.array(
        z.object({
          content: z.string(),
          metadata: z.record(z.string(), z.any()).optional(),
        })
      ),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
      documentIds: z.array(z.string()).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    try {
      const [projectData] = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1);

      if (!projectData) {
        return { success: false, message: "Project not found" };
      }

      const config = projectData?.ftsConfig;
      const miniSearchVec = new OramaFullTextSearch({
        persistDirectory: projectData.id!,
        provider: "minisearch",
        indexName: projectData.id!,
        ftsConfig: config!,
      });

      await miniSearchVec.initialize();

      // Add documents to index
      const texts = input.documents.map((doc) => doc.content);
      const metadatas = input.documents.map((doc) => doc.metadata || {});

      const documentIds = await miniSearchVec.addTexts(texts, metadatas);

      return {
        success: true,
        message: `Added ${documentIds.length} documents successfully`,
        documentIds,
      };
    } catch (error) {
      console.error("Failed to add documents:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to add documents",
      };
    }
  });

// Search documents
export const demoFulltextSearch = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/demo-fulltext-search",
    summary: "Demo fulltext search",
    tags: ["RAG"],
  })
  .input(
    z.object({
      projectId: z.string(),
      query: z.string(),
      topK: z.number().optional().default(10),
      minScore: z.number().optional().default(0),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
      results: z
        .array(
          z.object({
            id: z.string(),
            content: z.string(),
            metadata: z.record(z.string(), z.any()),
            score: z.number(),
          })
        )
        .optional(),
      count: z.number().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    try {
      const [projectData] = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1);

      if (!projectData) {
        return { success: false, message: "Project not found" };
      }

      const config = projectData?.ftsConfig;
      const miniSearchVec = new OramaFullTextSearch({
        persistDirectory: projectData.id!,
        provider: "minisearch",
        indexName: projectData.id!,
        ftsConfig: config!,
      });

      await miniSearchVec.initialize();

      // Search the index
      const results = await miniSearchVec.search(input.query, {
        topK: input.topK,
        minScore: input.minScore,
      });

      return {
        success: true,
        message: `Found ${results.length} results`,
        results,
        count: results.length,
      };
    } catch (error) {
      console.error("Failed to search:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to search",
      };
    }
  });

// Delete documents
export const demoFulltextDelete = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/demo-fulltext-delete",
    summary: "Delete documents from fulltext search",
    tags: ["RAG"],
  })
  .input(
    z.object({
      projectId: z.string(),
      documentIds: z.array(z.string()),
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
      const [projectData] = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1);

      if (!projectData) {
        return { success: false, message: "Project not found" };
      }

      const config = projectData?.ftsConfig;
      const miniSearchVec = new OramaFullTextSearch({
        persistDirectory: projectData.id!,
        provider: "minisearch",
        indexName: projectData.id!,
        ftsConfig: config!,
      });

      await miniSearchVec.initialize();
      await miniSearchVec.delete(input.documentIds);

      return {
        success: true,
        message: `Deleted ${input.documentIds.length} documents successfully`,
      };
    } catch (error) {
      console.error("Failed to delete documents:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete documents",
      };
    }
  });

// Clear index
export const demoFulltextClear = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/demo-fulltext-clear",
    summary: "Clear all documents from the index",
    tags: ["RAG"],
  })
  .input(
    z.object({
      projectId: z.string(),
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
      const [projectData] = await db
        .select()
        .from(project)
        .where(eq(project.id, input.projectId))
        .limit(1);

      if (!projectData) {
        return { success: false, message: "Project not found" };
      }

      const config = projectData?.ftsConfig;
      const miniSearchVec = new OramaFullTextSearch({
        persistDirectory: projectData.id!,
        provider: "minisearch",
        indexName: projectData.id!,
        ftsConfig: config!,
      });

      await miniSearchVec.initialize();
      await miniSearchVec.clear();

      return {
        success: true,
        message: "Index cleared successfully",
      };
    } catch (error) {
      console.error("Failed to clear index:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to clear index",
      };
    }
  });

export const demoRouter = os.$context<AppContext>().prefix("/demo").router({
  demoFulltextAdd,
  demoFulltextSearch,
  demoFulltextDelete,
  demoFulltextClear,
});
