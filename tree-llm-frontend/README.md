# tree-llm-frontend

Vite + React + TypeScript frontend for the tree-based LLM UI, rendered
with React Flow (`@xyflow/react`).

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your backend if not localhost:3001
npm run dev
```

Make sure `tree-llm-backend` is running first (`npm run dev` in that
project, on port 3001 by default).

## How it works

- **`api.ts`** — thin fetch wrapper around the backend's `/tree`,
  `/nodes`, `/nodes/:id` endpoints.
- **`layout.ts`** — converts the flat `TreeNode[]` the backend returns
  into React Flow's `Node[]`/`Edge[]` shape. Positions are computed
  with `dagre` (React Flow itself doesn't do graph layout — you have
  to bring your own, and dagre is the standard pairing). The whole
  tree is relaid-out on every fetch rather than incrementally updated;
  fine at this scale, revisit if the tree gets large.
- **`TreeNodeCard.tsx`** — the custom node renderer: shows a truncated
  prompt/response and Branch/Delete buttons, plus click-to-expand.
  Buttons dispatch `window` custom events (`branch-node`, `delete-node`,
  `expand-node`) rather than taking props, because `nodeTypes` is
  created once outside the component tree and doesn't have an easy
  path to receive per-render callbacks without extra wiring. Fine for
  v1; a context provider is the cleaner fix if this pattern needs to
  grow.
- **`NodeDetailView.tsx`** — a modal showing a node's full prompt and
  response as rendered markdown (`react-markdown` + `remark-gfm`),
  opened by clicking a node card. Has its own Branch/Delete actions,
  using the same event bus.
- **`NodePicker.tsx`** — a searchable, filterable list for selecting
  nodes to "merge" as extra context into a new branch. Filters
  client-side over prompt/response text; fine at the scale a local
  single-user tree realistically reaches.
- **`App.tsx`** — owns the tree state, refetches `/tree` after every
  mutation, and renders: starting a fresh root conversation, branching
  from whichever node's "+ Branch" button was clicked (with an
  optional merge-context picker in that same panel), the expanded
  node detail modal, and delete handling.

## Merging context across branches

The branch panel includes an optional "Merge context from another
branch" picker. Selecting one or more nodes there means the backend
will pull in their full prompt/response as reference material for the
new prompt — without those nodes needing to be ancestors of the branch
you're creating. This is how you deliberately let, say, a "backend"
branch see what a "frontend" branch decided, while keeping branches
isolated from each other by default. See the backend README's
"Merging context across branches" section for exactly how that's
assembled server-side.

## What's NOT here yet (on purpose)

- No streaming — a branch submission shows a loading state and then
  the full response appears once the backend's `generateText` call
  resolves. Swap to token-by-token rendering once `streamText` is
  wired up on the backend.
- No zoom-to-node or node selection/highlighting beyond React Flow's
  defaults.
- Manual refetch-after-mutation instead of optimistic updates — simple
  and correct, just not instant.
- The merge picker filters client-side and caps results at 30 — fine
  now, but a server-side search endpoint would be needed if the tree
  grows large.
