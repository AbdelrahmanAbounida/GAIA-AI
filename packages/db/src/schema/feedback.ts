import { sqliteTable } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base";
import { user } from "./auth";

export const feedback = sqliteTable("feedback", (t) => ({
  ...baseColumns(t),
  content: t.text().notNull(),
  useEmail: t.text("use_email").notNull(),
  totalStars: t.integer("total_stars").notNull().default(0),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}));
