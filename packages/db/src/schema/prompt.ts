import { index, sqliteTable } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base";
import { project } from "./project";

/** Knowledge documents */
export const prompt = sqliteTable("prompts", (t) => ({
  ...baseColumns(t),
  projectId: t
    .text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  content: t.text("content").notNull(),
}));
