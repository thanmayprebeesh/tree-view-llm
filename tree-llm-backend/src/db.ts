import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const sqlite = new Database(process.env.DB_PATH ?? "tree.db");
sqlite.pragma("journal_mode = WAL");

// Create the table on boot if it doesn't exist yet.
// Fine for a "very simple version" — swap for drizzle-kit migrations
// once the schema starts changing.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    label TEXT,
    created_at TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
