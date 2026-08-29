import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Adjacency-list model: every node points at its parent (or null for a root).
// This is deliberately simple — no separate "edges" table. A tree is just
// nodes-with-a-parent-pointer, and that's all you need until you have a
// reason (e.g. merging two parents) to model edges as first-class rows.
export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  label: text("label"),
  createdAt: text("created_at").notNull(),
});
