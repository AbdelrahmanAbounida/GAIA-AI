// packages/db/src/schema/credential.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const credential = sqliteTable("credentials", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  credentialType: text("credential_type", {
    enum: ["vectorstore", "ai_model", "embedding"],
  }).notNull(),
  capabilities: text("capabilities", { mode: "json" }), // for more that task (ai_model, vectorstore)
  name: text("name"), // in case of local conntion
  models: text("models", { mode: "json" }), // in case of local conntion / ollama
  provider: text("provider").notNull(),
  apiKey: text("api_key").notNull(),
  proxy: text("proxy"),
  baseUrl: text("base_url"),
  dynamicFields: text("dynamic_fields", { mode: "json" }), // for vectorstore
  isValid: integer("is_valid", { mode: "boolean" }).notNull().default(true),
  lastValidatedAt: integer("last_validated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const credentialRelations = relations(credential, ({ one }) => ({
  user: one(user, {
    fields: [credential.userId],
    references: [user.id],
  }),
}));
