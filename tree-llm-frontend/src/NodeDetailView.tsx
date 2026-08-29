import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TreeNode } from "./types";

export function NodeDetailView({
  node,
  onClose,
}: {
  node: TreeNode;
  onClose: () => void;
}) {
  // Close on Escape, same as most modal UIs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="node-detail-overlay" onClick={onClose}>
      <div className="node-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="node-detail-header">
          <div className="node-detail-meta">
            <span>{node.metadata.model}</span>
            {node.metadata.promptTokens != null && (
              <span>{node.metadata.promptTokens} prompt tok</span>
            )}
            {node.metadata.completionTokens != null && (
              <span>{node.metadata.completionTokens} completion tok</span>
            )}
            <span>{new Date(node.metadata.createdAt).toLocaleString()}</span>
          </div>
          <button className="node-detail-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="node-detail-body">
          <div className="node-detail-section">
            <h4>Prompt</h4>
            <div className="node-detail-text markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{node.prompt}</ReactMarkdown>
            </div>
          </div>

          <div className="node-detail-section">
            <h4>Response</h4>
            <div className="node-detail-text markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{node.response}</ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="node-detail-actions">
          {/* Same custom-event bus used by TreeNodeCard's buttons — see
              the comment there for why. Branch also closes the modal so
              the sidebar's branch panel is visible underneath it. */}
          <button
            className="tree-node-branch-btn"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("branch-node", { detail: node.id }));
              onClose();
            }}
          >
            + Branch
          </button>
          <button
            className="tree-node-delete-btn"
            onClick={() => {
              // Don't onClose() here: window.confirm() inside the
              // delete-node handler blocks synchronously, so if the
              // user cancels we want the modal to stay open. App.tsx
              // clears expandedNodeId itself once the node is actually
              // gone from the tree.
              window.dispatchEvent(new CustomEvent("delete-node", { detail: node.id }));
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}