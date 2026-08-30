import { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TreeNode } from "./types";

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function NodeDetailView({
  node,
  allNodes,
  onClose,
}: {
  node: TreeNode;
  allNodes: TreeNode[];
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

  // Resolve merged-context ids to their actual nodes for display. A
  // referenced id can be missing if that node was since deleted — we
  // skip it rather than showing a broken chip; DELETE doesn't clean up
  // references to a node from other nodes' additionalContextNodeIds,
  // so this is the display-side equivalent of the backend's own
  // "silently skip missing ids" behavior in getContextNodes().
  const mergedContextNodes = useMemo(() => {
    if (!node.additionalContextNodeIds?.length) return [];
    return node.additionalContextNodeIds
      .map((id) => allNodes.find((n) => n.id === id))
      .filter((n): n is TreeNode => n != null);
  }, [node.additionalContextNodeIds, allNodes]);

  return (
    <div className="node-detail-overlay" onClick={onClose}>
      <div className="node-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="node-detail-header">
          <div className="node-detail-header-left">
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

            {mergedContextNodes.length > 0 && (
              <div className="node-detail-merged-context">
                <span className="node-detail-merged-context-label">Merged context from:</span>
                {mergedContextNodes.map((source) => (
                  <button
                    key={source.id}
                    className="node-detail-merged-chip"
                    // Jump to the source node's own detail view, reusing
                    // the same event the tree cards use to open this
                    // modal in the first place.
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("expand-node", { detail: source.id }))
                    }
                  >
                    {truncate(source.prompt, 40)}
                  </button>
                ))}
              </div>
            )}
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