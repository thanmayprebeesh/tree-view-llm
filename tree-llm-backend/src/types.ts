// One node = one prompt/response pair.
// A node with parentId === null is a root (start of a new tree/conversation).

export interface NodeMetadata {
  model: string;            // e.g. "claude-sonnet-4-6"
  promptTokens?: number;
  completionTokens?: number;
  createdAt: string;        // ISO timestamp
  label?: string;           // optional user-given branch label, e.g. "try w/ more detail"
}

export interface TreeNode {
  id: string;
  parentId: string | null;
  prompt: string;
  response: string;
  metadata: NodeMetadata;
  // Ids of other nodes whose prompt/response were pulled in as extra
  // context for this node, on top of its normal ancestor chain. This
  // is how cross-branch "merging" works — see context.ts.
  additionalContextNodeIds?: string[];
}

// What the client sends to create a new node (branch from `parentId`,
// or start a new root if parentId is null).
export interface CreateNodeRequest {
  parentId: string | null;
  prompt: string;
  model?: string;
  // Optional: ids of other nodes (from any branch) to pull in as extra
  // context for this one prompt, e.g. giving a "backend" branch the
  // full prompt/response of a specific node from the "frontend" branch.
  additionalContextNodeIds?: string[];
}
