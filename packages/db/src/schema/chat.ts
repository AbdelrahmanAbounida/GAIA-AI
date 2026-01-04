import { sqliteTable } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base";
import { user } from "./auth";

export const chat = sqliteTable("chats", (t) => ({
  ...baseColumns(t),
  name: t.text().notNull(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}));

export const message = sqliteTable("messages", (t) => ({
  ...baseColumns(t),
  chatId: t
    .text("chat_id")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  role: t.text().notNull(),
  parts: t.text({ mode: "json" }).notNull(),
  attachments: t.text({ mode: "json" }),
  metadata: t.text({ mode: "json" }),
}));

export const vote = sqliteTable("votes", (t) => ({
  ...baseColumns(t),
  chatId: t
    .text("chat_id")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  messageId: t
    .text("message_id")
    .notNull()
    .references(() => message.id, { onDelete: "cascade" }),
  isUpvoted: t.integer("is_upvoted", { mode: "boolean" }).notNull(),
}));

export const stream = sqliteTable("streams", (t) => ({
  ...baseColumns(t),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  chatId: t
    .text("chat_id")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
}));
