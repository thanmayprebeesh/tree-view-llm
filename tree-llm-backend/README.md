# tree-llm-backend

Minimal backend for a tree/branch-based LLM chat UI. One node = one
prompt/response pair, with a single `parentId` pointer. Branching is
just "create a new node with an existing node as parent" — there's no
special-case branch logic, which keeps the model dead simple.

## Stack

- **Hono** — lightweight TS-native web framework
- **better-sqlite3 + Drizzle** — storage (adjacency-list: nodes point at their parent, no separate edges table)
- **Vercel AI SDK (`ai` + `@ai-sdk/google`)** — model calls, currently pointed at Gemini so you can test for free
- **nanoid** — node IDs

## Setup

```bash
npm install
cp .env.example .env   # add your GOOGLE_GENERATIVE_AI_API_KEY
npm run dev
```


### Switching providers

Because everything routes through the AI SDK's unified `generateText`
call in `src/server.ts`, swapping providers is small:

```ts
// swap this import...
import { google } from "@ai-sdk/google";
// ...for this...
import { anthropic } from "@ai-sdk/anthropic";

// and this...
model: google(model),
// ...for this
model: anthropic(model),
```

Update `DEFAULT_MODEL` and the env var name in `.env` to match
whichever provider you pick (`npm install @ai-sdk/anthropic` first).

Server boots on `:3001` and creates `tree.db` automatically on first run.


I'll work on multiple api provisions concurrently later

## API

### `GET /health`
Liveness check.

### `GET /tree`
Returns every node, flat, as `TreeNode[]`. The frontend reconstructs the
tree shape client-side from `parentId` pointers — this endpoint doesn't
do any tree-walking itself.

### `GET /roots`
Returns only top-level nodes (`parentId === null`) — useful for a
"conversations" list view.

### `POST /nodes`
Creates a new node: branches from `parentId` (or starts a fresh root if
`parentId` is `null`).

```json
{
  "parentId": "abc123" | null,
  "prompt": "your message",
  "model": "gemini-3.6-flash"   // optional, defaults to gemini-3.6-flash
}
```

What happens on the server:
1. Walks from `parentId` up to the root, collecting the ancestor chain (`context.ts`).
2. Converts that chain into a flat message array (each ancestor contributes a user + assistant message).
3. Appends the new prompt, calls the model.
4. Persists the new node and returns it.

This ancestor-walk **is the context-assembly policy** for the whole app
right now: a branch always sees its full path from root, nothing more,
nothing less. That's the one thing worth reading in `src/context.ts`
before you change anything — every other feature (context pruning,
cross-branch merging, manual ancestor selection) should be layered on
top of that function, not tangled into the route handler.

### `DELETE /nodes/:id`
Deletes a single node. **Does not cascade** — children of a deleted
node are left with a dangling `parentId`. `getAncestorChain` handles
that gracefully (stops walking rather than throwing), but you'll want
real cascade-or-reparent logic before this matters in practice.

## Known v1 simplifications (on purpose)

- No auth / no multi-user — single local SQLite file.
- No streaming yet — `generateText` returns the full response at once.
  Swapping in `streamText` + SSE is a natural next step once the tree
  UI itself works.
- No cascade deletes.
- Table is created with a raw `CREATE TABLE IF NOT EXISTS` rather than
  Drizzle migrations — fine while the schema is this small, but switch
  to `drizzle-kit` migrations once you start changing columns.
