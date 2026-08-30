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

/**
 * Fetches a specific set of nodes by id, in the order given. Used for
 * "merge" context: nodes picked from anywhere in the tree (not
 * necessarily an ancestor of the node being created).
 *
 * Deliberately does NOT walk each node's own ancestors — only that
 * single node's own prompt/response is pulled in. Walking full
 * ancestor chains for every merged-in node would silently drag in an
 * entire other branch's history, which defeats the point of keeping
 * branches isolated by default.
 */
export async function getContextNodes(nodeIds: string[]) {
  const results: (typeof nodes.$inferSelect)[] = [];
  for (const id of nodeIds) {
    const [node] = await db.select().from(nodes).where(eq(nodes.id, id));
    if (node) results.push(node); // silently skip ids that no longer exist
  }
  return results;
}

/**
 * Formats merged-in context nodes as a labeled text block, meant to be
 * prepended to the new prompt rather than inserted as fake conversation
 * turns. Splicing another branch's Q&A into the message array as if the
 * model said it itself would misrepresent the conversation history to
 * the model; a clearly-labeled reference block keeps it honest about
 * where this information actually came from.
 */
export function formatAdditionalContext(contextNodes: (typeof nodes.$inferSelect)[]): string {
  if (contextNodes.length === 0) return "";

  const blocks = contextNodes
    .map(
      (n) =>
        `---\nPrompt: ${n.prompt}\nResponse: ${n.response}\n---`
    )
    .join("\n\n");

  return `Additional context from other branch(es) of this project, for reference:\n\n${blocks}\n\n`;
}
