# tree-llm

A tree/branch-based interface for interacting with an LLM — instead of
one linear chat thread, every prompt/response is a node with a parent,
so you can branch off any point in the conversation and explore
multiple directions without losing or polluting earlier context.

## Structure

```
tree-llm/
├── backend/    Hono + SQLite + Vercel AI SDK — see backend/README.md
└── frontend/   Vite + React + React Flow    — see frontend/README.md
```

## Quickstart

```bash
# terminal 1
cd backend
npm install
cp .env.example .env   # add a free Gemini key: https://aistudio.google.com/apikey
npm run dev             # http://localhost:3001

# terminal 2
cd frontend
npm install
cp .env.example .env
npm run dev              # http://localhost:5173
```

Open the frontend URL, type a prompt in "New conversation," then use
"+ Branch" on any node to fork the conversation from that point.

## How context assembly works

Each node stores exactly one prompt/response pair and a pointer to its
parent. When you branch from a node, the backend walks from that node
up to the root, replays every ancestor as prior conversation turns,
and appends your new prompt — see `backend/src/context.ts` for the
one function that defines this behavior. Everything else in the app
is built around that.

Sibling branches are isolated by default — e.g. branching a project's
"frontend" and "backend" work off the same root idea means neither
sees the other's prompts/responses, so unrelated work doesn't pollute
each other's context. When you deliberately want one branch to see
another's output, the branch panel's "Merge context from another
branch" picker lets you attach specific nodes (from anywhere in the
tree) as extra, clearly-labeled reference material for that one
prompt — see the backend README for exactly how that's assembled.

## Status

Early / v1. No streaming, no auth, no cascade deletes, single local
SQLite file — see each subproject's README for the full list of
what's deliberately left out for now.
