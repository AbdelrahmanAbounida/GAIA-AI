import { randomUUID } from "crypto";

export const baseColumns = (t: Record<string, any>) => ({
  id: t
    .text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => randomUUID()),
  createdAt: t
    .integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: t
    .integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
