import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { nodes } from "./schema.js";
import type { CoreMessage } from "ai";

/**
 * Walks from `nodeId` up to the root (parentId === null), collecting nodes
 * along the way, then returns them oldest-first as a flat message array.
 *
 * This is the single most important function in the app: it defines what
 * "context" means for a branch. Right now the rule is the simplest
 * possible one — "full path from root to here, nothing more, nothing
 * less." That's a deliberate v1 choice; letting the user exclude/include
 * ancestors, or pull in nodes from a *different* branch, is a real
 * feature to add later, but it should be layered on top of this, not
 * built into it from day one.
 */
export async function getAncestorChain(nodeId: string | null) {
  const chain: (typeof nodes.$inferSelect)[] = [];
  let currentId = nodeId;

  while (currentId !== null) {
    const [node] = await db.select().from(nodes).where(eq(nodes.id, currentId));
    if (!node) break; // dangling parent id — stop rather than throw
    chain.push(node);
    currentId = node.parentId;
  }

  return chain.reverse(); // root-first
}

/**
 * Converts an ancestor chain into the message array shape the AI SDK
 * expects. Each node contributes a user message (its prompt) and an
 * assistant message (its response).
 */
export function chainToMessages(chain: (typeof nodes.$inferSelect)[]): CoreMessage[] {
  const messages: CoreMessage[] = [];
  for (const node of chain) {
    messages.push({ role: "user", content: node.prompt });
    messages.push({ role: "assistant", content: node.response });
  }
  return messages;
}
