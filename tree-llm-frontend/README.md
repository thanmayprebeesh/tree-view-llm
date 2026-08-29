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
  prompt/response and a "+ Branch" button. The button dispatches a
  `window` custom event (`branch-node`) rather than taking a prop,
  because `nodeTypes` is created once outside the component tree and
  doesn't have an easy path to receive per-render callbacks without
  extra wiring. Fine for v1; a context provider is the cleaner fix if
  this pattern needs to grow.
- **`App.tsx`** — owns the tree state, refetches `/tree` after every
  mutation, and renders two flows: starting a fresh root conversation,
  and branching from whichever node's "+ Branch" button was clicked.

## What's NOT here yet (on purpose)

- No streaming — a branch submission shows a loading state and then
  the full response appears once the backend's `generateText` call
  resolves. Swap to token-by-token rendering once `streamText` is
  wired up on the backend.
- No node deletion in the UI (the backend route exists — `DELETE
  /nodes/:id` — just not hooked up here yet).
- No zoom-to-node or node selection/highlighting beyond React Flow's
  defaults.
- Manual refetch-after-mutation instead of optimistic updates — simple
  and correct, just not instant.
