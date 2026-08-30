// Mirrors src/types.ts on the backend. Keep these in sync manually for
// now — if this project grows, pull both into a shared package.

export interface NodeMetadata {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  createdAt: string;
  label?: string;
}

export interface TreeNode {
  id: string;
  parentId: string | null;
  prompt: string;
  response: string;
  metadata: NodeMetadata;
  additionalContextNodeIds?: string[];
}

export interface CreateNodeRequest {
  parentId: string | null;
  prompt: string;
  model?: string;
  additionalContextNodeIds?: string[];
}
