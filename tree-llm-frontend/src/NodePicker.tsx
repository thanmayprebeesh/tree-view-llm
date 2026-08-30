import { useMemo, useState } from "react";
import type { TreeNode } from "./types";

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/**
 * A simple text-filtered list of nodes to pick from, for attaching
 * "merged" context to a new branch. Filters client-side over prompt +
 * response text — fine at the scale a local single-user tree will
 * realistically reach; swap for a server-side search endpoint if the
 * tree ever gets large enough for this to feel slow.
 */
export function NodePicker({
  allNodes,
  excludeIds,
  selectedIds,
  onChange,
}: {
  allNodes: TreeNode[];
  excludeIds: string[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const excluded = new Set(excludeIds);
    const q = query.trim().toLowerCase();
    return allNodes
      .filter((n) => !excluded.has(n.id))
      .filter((n) => {
        if (!q) return true;
        return (
          n.prompt.toLowerCase().includes(q) || n.response.toLowerCase().includes(q)
        );
      })
      .slice(0, 30); // cap render count — this is a picker, not a full browser
  }, [allNodes, excludeIds, query]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="node-picker">
      <input
        className="node-picker-search"
        type="text"
        placeholder="Search nodes by prompt or response…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {selectedIds.length > 0 && (
        <div className="node-picker-selected">
          {selectedIds.map((id) => {
            const node = allNodes.find((n) => n.id === id);
            if (!node) return null;
            return (
              <span key={id} className="node-picker-chip">
                {truncate(node.prompt, 30)}
                <button onClick={() => toggle(id)} aria-label="Remove">
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="node-picker-list">
        {filtered.length === 0 && (
          <div className="node-picker-empty">No matching nodes.</div>
        )}
        {filtered.map((n) => (
          <button
            key={n.id}
            className={
              "node-picker-item" + (selectedIds.includes(n.id) ? " node-picker-item-selected" : "")
            }
            onClick={() => toggle(n.id)}
          >
            <div className="node-picker-item-prompt">{truncate(n.prompt, 60)}</div>
            <div className="node-picker-item-response">{truncate(n.response, 90)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
