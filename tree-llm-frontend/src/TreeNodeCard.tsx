import { Handle, Position } from "@xyflow/react";
import type { TreeNode } from "./types";

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export interface TreeNodeData {
  node: TreeNode;
}

export function TreeNodeCard({ data }: { data: TreeNodeData }) {
  const { node } = data;

  return (
    <div className="tree-node-card">
      <Handle type="target" position={Position.Top} />

      <div className="tree-node-prompt">{truncate(node.prompt, 80)}</div>
      <div className="tree-node-response">{truncate(node.response, 140)}</div>

      <div className="tree-node-meta">
        <span>{node.metadata.model}</span>
        {node.metadata.completionTokens != null && (
          <span>{node.metadata.completionTokens} tok</span>
        )}
      </div>

      {/* Branch button dispatches a custom event caught in App.tsx rather
          than taking an onBranch prop directly — React Flow node types
          are registered once and don't easily thread per-node callbacks
          through props without extra plumbing (nodeTypes is created
          outside the render tree). A tiny custom-event bus keeps this
          simple for v1. */}
      <button
        className="tree-node-branch-btn"
        onClick={() => window.dispatchEvent(new CustomEvent("branch-node", { detail: node.id }))}
      >
        + Branch
      </button>

      <button
        className="tree-node-delete-btn"
        onClick={() => window.dispatchEvent(new CustomEvent("delete-node", { detail: node.id }))}
      >
        - Delete
      </button>


      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
