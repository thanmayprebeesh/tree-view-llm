import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "./api";
import { layoutTree } from "./layout";
import { TreeNodeCard } from "./TreeNodeCard";
import { NodeDetailView } from "./NodeDetailView";
import type { TreeNode } from "./types";
import "./index.css";

const nodeTypes = { treeNode: TreeNodeCard };

export default function App() {
  const [treeNodes, setTreeNodes] = useState<Node[]>([]);
  const [treeEdges, setTreeEdges] = useState<Edge[]>([]);
  const [rootPrompt, setRootPrompt] = useState("");
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);
  const [branchPrompt, setBranchPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const flat = await api.getTree();
    const { nodes, edges } = layoutTree(flat);
    setTreeNodes(nodes);
    setTreeEdges(edges);
  }, []);

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, [refresh]);

  // Custom-event bridge from TreeNodeCard's "+ Branch" button — see the
  // comment in TreeNodeCard.tsx for why this isn't a normal prop.
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setPendingParentId(id);
    };
    window.addEventListener("branch-node", handler);
    return () => window.removeEventListener("branch-node", handler);
  }, []);

  // Same bridge pattern for the Delete button.
  useEffect(() => {
    const handler = async (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      // Reminder: DELETE /nodes/:id does not cascade on the backend —
      // if this node has children, they're left with a dangling
      // parentId. getAncestorChain() stops gracefully rather than
      // throwing, but those children will effectively become
      // "orphaned" branches missing part of their context history.
      if (!window.confirm("Delete this node? Child branches (if any) will be orphaned.")) {
        return;
      }
      setError(null);
      try {
        await api.deleteNode(id);
        if (pendingParentId === id) setPendingParentId(null);
        await refresh();
      } catch (err) {
        setError(String(err));
      }
    };
    window.addEventListener("delete-node", handler);
    return () => window.removeEventListener("delete-node", handler);
  }, [refresh, pendingParentId]);

  // Same bridge pattern for expanding a node into the detail view.
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setExpandedNodeId(id);
    };
    window.addEventListener("expand-node", handler);
    return () => window.removeEventListener("expand-node", handler);
  }, []);

  // The expanded node is derived from treeNodes rather than duplicated in
  // its own state, so it always reflects the latest fetch. If it's ever
  // deleted (e.g. via the detail view's own Delete button), it'll simply
  // stop matching after the next refresh() and the modal auto-closes.
  const expandedNode: TreeNode | null = useMemo(() => {
    if (!expandedNodeId) return null;
    const match = treeNodes.find((n) => n.id === expandedNodeId);
    return (match?.data as { node: TreeNode } | undefined)?.node ?? null;
  }, [expandedNodeId, treeNodes]);

  useEffect(() => {
    if (expandedNodeId && !expandedNode) setExpandedNodeId(null);
  }, [expandedNodeId, expandedNode]);

  const submitRoot = useCallback(async () => {
    if (!rootPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.createNode({ parentId: null, prompt: rootPrompt });
      setRootPrompt("");
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [rootPrompt, refresh]);

  const submitBranch = useCallback(async () => {
    if (!pendingParentId || !branchPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.createNode({ parentId: pendingParentId, prompt: branchPrompt });
      setBranchPrompt("");
      setPendingParentId(null);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [pendingParentId, branchPrompt, refresh]);

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  return (
    <div className="app">
      <div className="canvas">
        <ReactFlow
          nodes={treeNodes}
          edges={treeEdges}
          nodeTypes={nodeTypesMemo}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <div className="sidebar">
        <h2>Tree LLM</h2>

        {error && <div className="error-banner">{error}</div>}

        <div className="panel">
          <h3>New conversation</h3>
          <textarea
            value={rootPrompt}
            onChange={(e) => setRootPrompt(e.target.value)}
            placeholder="Start a new root prompt…"
            rows={3}
          />
          <button disabled={loading} onClick={submitRoot}>
            {loading ? "Sending…" : "Send"}
          </button>
        </div>

        {pendingParentId && (
          <div className="panel">
            <h3>Branch from node</h3>
            <div className="branch-target">{pendingParentId}</div>
            <textarea
              value={branchPrompt}
              onChange={(e) => setBranchPrompt(e.target.value)}
              placeholder="New prompt for this branch…"
              rows={3}
            />
            <div className="branch-actions">
              <button disabled={loading} onClick={submitBranch}>
                {loading ? "Sending…" : "Send"}
              </button>
              <button className="secondary" onClick={() => setPendingParentId(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {expandedNode && (
        <NodeDetailView node={expandedNode} onClose={() => setExpandedNodeId(null)} />
      )}
    </div>
  );
}