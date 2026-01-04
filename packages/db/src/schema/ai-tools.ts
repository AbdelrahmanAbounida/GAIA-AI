import { index, sqliteTable } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base";
import { project } from "./project";

/** Knowledge documents */
export const ragDocument = sqliteTable("rag_documents", (t) => ({
  ...baseColumns(t),
  projectId: t
    .text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  fileId: t.text("file_id").notNull().unique(),
  fileName: t.text("file_name").notNull(),
  sourceType: t
    .text("source_type", {
      enum: ["file", "text", "json", "url", "api"],
    })
    .notNull()
    .default("file"),
  fileType: t
    .text("file_type", {
      enum: ["pdf", "csv", "xls", "txt", "json", "docx", "link", "other"],
    })
    .notNull(),
  content: t.text("content"),
  metadata: t.text("metadata", { mode: "json" }),

  totalChunks: t.integer("total_chunks").notNull().default(0),
  status: t
    .text("status", {
      enum: ["pending", "processing", "completed", "failed"],
    })
    .notNull()
    .default("pending"),
  processingError: t.text("processing_error"),
}));

export const tool = sqliteTable(
  "tools",
  (t) => ({
    ...baseColumns(t),

    projectId: t
      .text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),

    name: t.text("name").notNull(),
    description: t.text("description").notNull(),

    inputSchema: t.text("input_schema", { mode: "json" }),
    outputSchema: t.text("output_schema", { mode: "json" }),

    language: t
      .text("language", { enum: ["python", "javascript"] })
      .default("javascript"),
    dependencies: t.text("dependencies", { mode: "json" }),
    code: t.text("code"),

    // Configuration
    enabled: t.integer("enabled", { mode: "boolean" }).notNull().default(true),
    timeout: t.integer("timeout").default(30000),
    retries: t.integer("retries").default(0),

    // Usage stats
    totalCalls: t.integer("total_calls").notNull().default(0),
    lastUsedAt: t.integer("last_used_at", { mode: "timestamp" }),
  }),
  (t) => [index("tools_project_id_idx").on(t.projectId)]
);

// MCP
export const mcpServer = sqliteTable("mcp_servers", (t) => ({
  ...baseColumns(t),
  projectId: t
    .text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),

  name: t.text("name").notNull(),
  description: t.text("description"),

  // Connection details
  url: t.text("url"),
  transportType: t
    .text("transport_type", {
      enum: ["stdio", "sse", "streamable-http"],
    })
    .notNull()
    .default("streamable-http"),
  connectionType: t
    .text("connection_type", {
      enum: ["direct", "proxy"],
    })
    .notNull()
    .default("proxy"),

  // STDIO fields
  command: t.text("command"),
  args: t.text("args"),
  env: t.text("env", { mode: "json" }).$type<Record<string, string>>(),

  // Authentication
  customHeaders: t
    .text("custom_headers", { mode: "json" })
    .$type<Array<{ name: string; value: string; enabled: boolean }>>(),
  oauthClientId: t.text("oauth_client_id"),
  oauthClientSecret: t.text("oauth_client_secret"),
  oauthScope: t.text("oauth_scope"),

  // Proxy settings
  proxyUrl: t.text("proxy_url"),
  proxyAuthToken: t.text("proxy_auth_token"),
  proxyAuthHeader: t.text("proxy_auth_header").default("Authorization"),

  // Timeouts
  requestTimeout: t.integer("request_timeout").default(30000),
  maxTotalTimeout: t.integer("max_total_timeout").default(60000),
  resetTimeoutOnProgress: t
    .integer("reset_timeout_on_progress", { mode: "boolean" })
    .default(true),

  // Server info (from connection)
  capabilities: t.text("capabilities", { mode: "json" }),
  serverImplementation: t.text("server_implementation", { mode: "json" }),
  sessionId: t.text("session_id"),
  protocolVersion: t.text("protocol_version"),

  status: t
    .text("status", {
      enum: ["connected", "disconnected", "error", "connecting"],
    })
    .default("disconnected"),
  lastError: t.text("last_error"),
  lastConnectedAt: t.integer("last_connected_at", { mode: "timestamp" }),
}));
