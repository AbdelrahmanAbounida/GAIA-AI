import { os, eventIterator } from "@orpc/server";
import type { AppContext } from "../../types";
import { ragHandlers } from "./handler";
import { ragSchemas } from "./schema";
import { ragSpecs } from "./spec";

export const createAndIndexDocument = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/document/create-and-index",
    summary: "Create and index document",
    spec: ragSpecs.createAndIndexDocument,
  })
  .input(ragSchemas.createAndIndexDocumentInput)
  .output(ragSchemas.createAndIndexDocumentOutput)
  .handler(ragHandlers.createAndIndexDocument);

export const createAndIndexDocumentStreaming = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/document/create-and-index-streaming",
    summary: "Create and index document with streaming progress",
    spec: ragSpecs.createAndIndexDocumentStreaming,
  })
  .input(ragSchemas.createAndIndexDocumentInput)
  .output(eventIterator(ragSchemas.createAndIndexDocumentStreamingOutput))
  .handler(ragHandlers.createAndIndexDocumentStreaming);

export const validateVectorstoreConfig = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/validate-api-key",
    summary: "Validate API Key",
    spec: ragSpecs.validateVectorstoreConfig,
  })
  .input(ragSchemas.validateVectorstoreConfigInput)
  .output(ragSchemas.validateVectorstoreConfigOutput)
  .handler(ragHandlers.validateVectorstoreConfig);

export const searchDocuments = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/rag/document/search",
    summary: "Search documents",
    spec: ragSpecs.searchDocuments,
  })
  .input(ragSchemas.searchDocumentsInput)
  .output(ragSchemas.searchDocumentsOutput)
  .handler(ragHandlers.searchDocuments);

export const getRagDocuments = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/rag/document/list",
    summary: "List RAG documents for project",
    spec: ragSpecs.getRagDocuments,
  })
  .input(ragSchemas.getRagDocumentsInput)
  .output(ragSchemas.getRagDocumentsOutput)
  .handler(ragHandlers.getRagDocuments);

export const getRagDocument = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/rag/document/:id",
    summary: "Get single RAG document",
    spec: ragSpecs.getRagDocument,
  })
  .input(ragSchemas.getRagDocumentInput)
  .output(ragSchemas.getRagDocumentOutput)
  .handler(ragHandlers.getRagDocument);

export const deleteRagDocument = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/rag/document/:id",
    summary: "Delete RAG document and its vectors",
    spec: ragSpecs.deleteRagDocument,
  })
  .input(ragSchemas.deleteRagDocumentInput)
  .output(ragSchemas.deleteRagDocumentOutput)
  .handler(ragHandlers.deleteRagDocument);

export const getRAGSettings = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/rag/settings",
    summary: "Get RAG settings",
    spec: ragSpecs.getRAGSettings,
  })
  .input(ragSchemas.getRAGSettingsInput)
  .output(ragSchemas.getRAGSettingsOutput)
  .handler(ragHandlers.getRAGSettings);

export const updateRAGSettings = os
  .$context<AppContext>()
  .route({
    method: "PATCH",
    path: "/rag/settings",
    summary: "Update RAG settings",
    spec: ragSpecs.updateRAGSettings,
  })
  .input(ragSchemas.updateRAGSettingsInput)
  .output(ragSchemas.updateRAGSettingsOutput)
  .handler(ragHandlers.updateRAGSettings);

export const RagRouter = os.$context<AppContext>().router({
  createAndIndexDocument,
  createAndIndexDocumentStreaming,
  getRagDocuments,
  getRagDocument,
  deleteRagDocument,
  searchDocuments,
  getRAGSettings,
  updateRAGSettings,
  validateVectorstoreConfig,
});
