import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base";
import { user } from "./auth";

export const project = sqliteTable("projects", (t) => ({
  ...baseColumns(t),

  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: t.text("name").notNull(),
  description: t.text("description").default(""),

  // **********************************
  // RAG Configuration
  // **********************************

  // LLM Configuration
  llmProvider: t.text("llm_provider"),
  llmModel: t.text("llm_model").notNull(),
  llmConfig: t.text("llm_config", { mode: "json" }),

  // Embedding Configuration
  embeddingProvider: t.text("embedding_provider"),
  embeddingModel: t.text("embedding_model").notNull(),
  embeddingDimensions: t.integer("embedding_dimensions"),

  // Vector Store Configuration
  vectorStore: t
    .text("vector_store", {
      enum: [
        "faiss",
        "chroma",
        "pinecone",
        "qdrant",
        "weaviate",
        "milvus",
        "pgvector",
        "lancedb",
        "supabase",
      ],
    })
    .notNull()
    .default("faiss"),
  vectorStoreConfig: t.text("vector_store_config", { mode: "json" }), // legacy >> use credentials.dynamicFields

  // Search Configuration
  searchType: t
    .text("search_type", {
      enum: ["similarity", "mmr", "hybrid"],
    })
    .notNull()
    .default("similarity"),
  topK: t.integer("top_k").notNull().default(5),

  // Reranker Configuration
  reranker: t
    .text("reranker", {
      enum: ["none", "cohere", "cross-encoder"],
    })
    .notNull()
    .default("none"),
  useReranker: t
    .integer("use_reranker", { mode: "boolean" })
    .notNull()
    .default(false),

  // Chunking Configuration
  chunkingMethod: t
    .text("chunking_method", {
      enum: ["fixed", "sentence", "paragraph", "semantic"],
    })
    .notNull()
    .default("fixed"),
  chunkSize: t.integer("chunk_size").notNull().default(1000),
  chunkOverlap: t.integer("chunk_overlap").notNull().default(200),
  totalDocuments: t.integer("total_documents").notNull().default(0),

  // Generation Configuration
  temperature: t.real("temperature").notNull().default(0.7),
  maxTokens: t.integer("max_tokens").notNull().default(2000),

  // fulltext search
  fullTextSearch: t
    .text("full_text_search", {
      enum: ["flexsearch", "minisearch", "orama"],
    })
    .default("flexsearch"),
  ftsConfig: t.text("fts_config", { mode: "json" }),
}));
