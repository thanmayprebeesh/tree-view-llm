import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { db } from "./db.js";
import { nodes } from "./schema.js";
import { getAncestorChain, chainToMessages } from "./context.js";
import type { CreateNodeRequest, TreeNode } from "./types.js";

const app = new Hono();
app.use("*", cors()); // wide open for local dev — lock down before deploying anywhere real

const DEFAULT_MODEL = "gemini-3.6-flash";

function rowToTreeNode(row: typeof nodes.$inferSelect): TreeNode {
  return {
    id: row.id,
    parentId: row.parentId,
    prompt: row.prompt,
    response: row.response,
    metadata: {
      model: row.model,
      promptTokens: row.promptTokens ?? undefined,
      completionTokens: row.completionTokens ?? undefined,
      createdAt: row.createdAt,
      label: row.label ?? undefined,
    },
  };
}

// GET /tree — every node, flat. The frontend reconstructs the tree
// shape client-side from parentId pointers (trivial with React Flow).
app.get("/tree", async (c) => {
  const rows = await db.select().from(nodes);
  return c.json(rows.map(rowToTreeNode));
});

// GET /roots — just the top-level nodes, useful for a "conversations" list
app.get("/roots", async (c) => {
  const rows = await db.select().from(nodes).where(isNull(nodes.parentId));
  return c.json(rows.map(rowToTreeNode));
});

// POST /nodes — the core action: branch from `parentId` (or null for a
// fresh root) with a new prompt. Walks ancestors, calls the model,
// stores the result as a new node, returns it.
app.post("/nodes", async (c) => {
  const body = await c.req.json<CreateNodeRequest>();

  if (!body.prompt || typeof body.prompt !== "string") {
    return c.json({ error: "prompt is required" }, 400);
  }

  const model = body.model ?? DEFAULT_MODEL;

  // 1. Assemble context: everything from root down to the parent we're
  //    branching from, plus the new prompt.
  const ancestorChain = await getAncestorChain(body.parentId);
  const messages = chainToMessages(ancestorChain);
  messages.push({ role: "user", content: body.prompt });

  // 2. Call the model.
  const result = await generateText({
    model: google(model),
    messages,
  });

  // 3. Persist the new node.
  const id = nanoid();
  const createdAt = new Date().toISOString();

  await db.insert(nodes).values({
    id,
    parentId: body.parentId,
    prompt: body.prompt,
    response: result.text,
    model,
    promptTokens: result.usage?.promptTokens,
    completionTokens: result.usage?.completionTokens,
    createdAt,
  });

  const treeNode: TreeNode = {
    id,
    parentId: body.parentId,
    prompt: body.prompt,
    response: result.text,
    metadata: {
      model,
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      createdAt,
    },
  };

  return c.json(treeNode, 201);
});

// DELETE /nodes/:id — deletes a single node.
// NOTE: this does NOT cascade to children in this simple version.
// Deleting a node with children will leave them with a dangling
// parentId; getAncestorChain() stops gracefully at a missing parent,
// but you'll want cascade-or-reparent logic before this is real.
app.delete("/nodes/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(nodes).where(eq(nodes.id, id));
  return c.json({ deleted: id });
});

app.get("/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
console.log(`tree-llm-backend listening on :${port}`);
serve({ fetch: app.fetch, port });
