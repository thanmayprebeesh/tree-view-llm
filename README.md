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

## Status

Early / v1. No streaming, no auth, no cascade deletes, single local
SQLite file — see each subproject's README for the full list of
what's deliberately left out for now.

## Note on API usage

This project requires your own API key (Gemini, or another provider if you
swap it in) and makes calls to that provider on your behalf. You are
responsible for your own usage and any costs incurred under that
provider's terms of service. This project is provided as-is with no
warranty — see [LICENSE](./LICENSE).