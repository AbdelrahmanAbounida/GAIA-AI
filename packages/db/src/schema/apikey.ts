import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base";
import { user } from "./auth";
import { project } from "./project";

export const apikey = sqliteTable(
  "apikeys",
  (t) => ({
    ...baseColumns(t),
    name: text("name").notNull(),
    value: text("value").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
  }),
  (t) => [
    uniqueIndex("apikey_value_unique").on(t.value),
    index("apikey_project_idx").on(t.projectId),
    index("apikey_user_idx").on(t.userId),
    index("apikey_active_expires_idx").on(t.isActive, t.expiresAt),
  ]
);
