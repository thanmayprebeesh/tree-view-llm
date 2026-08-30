import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type { TreeNode } from "./types";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 120;

/**
 * Converts the flat list of TreeNodes the backend returns into React
 * Flow's Node[]/Edge[] shape, with positions computed by dagre.
 *
 * This is deliberately re-run on every fetch rather than incrementally
 * updated — the tree is small enough in v1 that a full relayout on
 * every change is simpler and fast enough. Optimize only if it's
 * actually slow with real usage.
 */
export function layoutTree(treeNodes: TreeNode[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 90 });

  for (const n of treeNodes) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const n of treeNodes) {
    if (n.parentId) g.setEdge(n.parentId, n.id);
  }

  dagre.layout(g);

  const nodes: Node[] = treeNodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "treeNode",
      // dagre gives center coordinates; React Flow wants top-left
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { node: n },
    };
  });

  const edges: Edge[] = treeNodes
    .filter((n) => n.parentId !== null)
    .map((n) => ({
      id: `${n.parentId}->${n.id}`,
      source: n.parentId as string,
      target: n.id,
    }));

  // Merged-context edges: drawn from each source node to the node that
  // pulled it in, styled distinctly from tree edges (dashed, different
  // color) so it's visually obvious this is a cross-branch reference,
  // not part of the strict parent/child structure. Deliberately NOT
  // added to the dagre graph above — dagre uses edges to rank/position
  // nodes, and letting a cross-branch reference influence layout could
  // pull unrelated branches toward each other or distort the tree
  // shape. These are rendered purely on top of the tree-derived layout.
  //
  // A referenced id can point at a node that's since been deleted; we
  // skip those rather than drawing an edge to nowhere.
  const existingIds = new Set(treeNodes.map((n) => n.id));
  const mergeEdges: Edge[] = treeNodes.flatMap((n) =>
    (n.additionalContextNodeIds ?? [])
      .filter((sourceId) => existingIds.has(sourceId))
      .map((sourceId) => ({
        id: `merge:${sourceId}->${n.id}`,
        source: sourceId,
        target: n.id,
        type: "straight",
        animated: false,
        style: { stroke: "#a9c1ff", strokeWidth: 1.5, strokeDasharray: "4 4" },
      }))
  );

  return { nodes, edges: [...edges, ...mergeEdges] };
}