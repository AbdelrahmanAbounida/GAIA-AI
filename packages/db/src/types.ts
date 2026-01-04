import type {
  InferInsertModel,
  InferSelectModel,
  InferEnum,
} from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import * as schema from "./schema";
import { z } from "zod";

// --- Auth Models ---
export type User = InferSelectModel<typeof schema.user>;
export type InsertUser = InferInsertModel<typeof schema.user>;
export const UserSchema = createSelectSchema(schema.user);
export const createUserSchema = createInsertSchema(schema.user).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Session = InferSelectModel<typeof schema.session>;
export type InsertSession = InferInsertModel<typeof schema.session>;
export const SessionSchema = createSelectSchema(schema.session);

export type Account = InferSelectModel<typeof schema.account>;
export type InsertAccount = InferInsertModel<typeof schema.account>;
export const AccountSchema = createSelectSchema(schema.account);

export type Verification = InferSelectModel<typeof schema.verification>;
export type InsertVerification = InferInsertModel<typeof schema.verification>;
export const VerificationSchema = createSelectSchema(schema.verification);

// Chat , messages
export type Chat = InferSelectModel<typeof schema.chat>;
export type Message = InferSelectModel<typeof schema.message>;
export type InsertChat = InferInsertModel<typeof schema.chat>;
export type InsertMessage = InferInsertModel<typeof schema.message>;
export const ChatSchema = createSelectSchema(schema.chat);
export const MessageSchema = createSelectSchema(schema.message);
export const createChatSchema = createInsertSchema(schema.chat, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createMessageSchema = createInsertSchema(schema.message, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// votes , suggestions, streams
export type Vote = InferSelectModel<typeof schema.vote>;
export type InsertVote = InferInsertModel<typeof schema.vote>;
export const VoteSchema = createSelectSchema(schema.vote);
export const createVoteSchema = createInsertSchema(schema.vote, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Stream = InferSelectModel<typeof schema.stream>;
export type InsertStream = InferInsertModel<typeof schema.stream>;
export const StreamSchema = createSelectSchema(schema.stream);
export const createStreamSchema = createInsertSchema(schema.stream, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Projects
export type Project = InferSelectModel<typeof schema.project>;
export type InsertProject = InferInsertModel<typeof schema.project>;
export const ProjectSchema = createSelectSchema(schema.project);
export const createProjectSchema = createInsertSchema(schema.project, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Feedback
export type Feedback = InferSelectModel<typeof schema.feedback>;
export type InsertFeedback = InferInsertModel<typeof schema.feedback>;
export const FeedbackSchema = createSelectSchema(schema.feedback);
export const createFeedbackSchema = createInsertSchema(
  schema.feedback,
  {}
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// credential schema
export type Credential = InferSelectModel<typeof schema.credential>;
export type InsertCredential = InferInsertModel<typeof schema.credential>;

// Zod Schemas
export const CredentialSchema = createSelectSchema(schema.credential);

export const createCredentialSchema = createInsertSchema(
  schema.credential,
  {}
).omit({
  id: true,
  userId: true,
  lastValidatedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCredentialSchema = createInsertSchema(schema.credential)
  .partial()
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  });

// apikey
export type ApiKey = InferSelectModel<typeof schema.apikey>;
export type InsertApiKey = InferInsertModel<typeof schema.apikey>;
export const ApiKeySchema = createSelectSchema(schema.apikey);
export const createApiKeySchema = createInsertSchema(schema.apikey, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// prompt
export type Prompt = InferSelectModel<typeof schema.prompt>;
export type InsertPrompt = InferInsertModel<typeof schema.prompt>;
export const PromptSchema = createSelectSchema(schema.prompt);
export const createPromptSchema = createInsertSchema(schema.prompt, {}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// RAG
export type RagDocument = InferSelectModel<typeof schema.ragDocument>;
export type InsertRagDocument = InferInsertModel<typeof schema.ragDocument>;
export type FileType = InferEnum<typeof schema.ragDocument.fileType>;
export const RagDocumentSchema = createSelectSchema(schema.ragDocument);
export const createRagDocumentSchema = createInsertSchema(
  schema.ragDocument
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RAGSettings = {
  llmProvider?: string | null;
  llmModel?: string;
  llmConfig?: Record<string, any> | null;
  embeddingProvider?: string | null;
  embeddingModel?: string;
  embeddingDimensions?: number;
  vectorStore?:
    | "faiss"
    | "chroma"
    | "pinecone"
    | "qdrant"
    | "weaviate"
    | "milvus"
    | "pgvector"
    | "lancedb"
    | "supabase";
  vectorStoreConfig?: Record<string, any> | null;
  searchType?: "similarity" | "mmr" | "hybrid";
  topK?: number;
  reranker?: "none" | "cohere" | "cross-encoder";
  useReranker?: boolean;
  chunkingMethod?: "fixed" | "sentence" | "paragraph" | "semantic";
  chunkSize?: number;
  chunkOverlap?: number;
  temperature?: number;
  maxTokens?: number;
  fullTextSearchTool?: "flexsearch" | "minisearch" | "orama";
  ftsConfig?: Record<string, any>;
};

export const RAGSettingsSchema = z.object({
  // LLM Configuration
  llmProvider: z.string().nullable().optional(),
  llmModel: z.string().optional(),
  llmConfig: z.record(z.string(), z.any()).nullable().optional(),

  // Embedding Configuration
  embeddingProvider: z.string().nullable().optional(),
  embeddingModel: z.string().optional(),

  // Vector Store Configuration
  vectorStore: z
    .enum([
      "faiss",
      "chroma",
      "pinecone",
      "qdrant",
      "weaviate",
      "milvus",
      "pgvector",
      "lancedb",
      "supabase",
    ])
    .optional(),
  vectorStoreConfig: z.record(z.string(), z.any()).nullable().optional(),

  // Search Configuration
  searchType: z.enum(["similarity", "mmr", "hybrid"]).optional(),
  topK: z.number().optional(),

  // Reranker
  reranker: z.enum(["none", "cohere", "cross-encoder"]).optional(),
  useReranker: z.boolean().optional(),

  // Chunking
  chunkingMethod: z
    .enum(["fixed", "sentence", "paragraph", "semantic"])
    .optional(),
  chunkSize: z.number().optional(),
  chunkOverlap: z.number().optional(),

  // Generation
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),

  // Full-Text Search
  fullTextSearchTool: z.enum(["flexsearch", "minisearch", "orama"]).optional(),
  ftsConfig: z.record(z.string(), z.any()).optional(),
});
// Tools
export type Tool = InferSelectModel<typeof schema.tool>;
export type InsertTool = InferInsertModel<typeof schema.tool>;
export const ToolSchema = createSelectSchema(schema.tool);
export const createToolSchema = createInsertSchema(schema.tool).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// MCP
export type MCPServer = InferSelectModel<typeof schema.mcpServer>;
export type InsertMCP = InferInsertModel<typeof schema.mcpServer>;
export const MCPServerSchema = createSelectSchema(schema.mcpServer);
export const createMCPSchema = createInsertSchema(schema.mcpServer).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
