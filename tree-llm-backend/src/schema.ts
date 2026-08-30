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
  // JSON-encoded string[] of other node ids whose prompt/response should
  // be pulled in as extra context when assembling this node's messages,
  // on top of its normal ancestor chain. This is deliberately separate
  // from parentId: the tree stays a strict single-parent structure (so
  // sibling branches remain isolated by default), and merging context
  // across branches is an explicit, opt-in list rather than changing
  // the tree shape itself. Stored as JSON text since SQLite has no
  // native array type — see context.ts for how it's read.
  additionalContextNodeIds: text("additional_context_node_ids"),
});

