// One node = one prompt/response pair.
// A node with parentId === null is a root (start of a new tree/conversation).

export interface NodeMetadata {
  model: string;            // e.g. "gemini-3.6-flash"
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
}

// What the client sends to create a new node (branch from `parentId`,
// or start a new root if parentId is null).
export interface CreateNodeRequest {
  parentId: string | null;
  prompt: string;
  model?: string;
}
