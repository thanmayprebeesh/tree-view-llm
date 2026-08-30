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
    created_at TEXT NOT NULL,
    additional_context_node_ids TEXT
  );
`);

// Defensive migration for anyone with an existing tree.db from before
// additional_context_node_ids existed. CREATE TABLE IF NOT EXISTS above
// only handles brand-new databases — it won't add a column to a table
// that's already there. Swap all of this for real drizzle-kit
// migrations once the schema needs to change more than occasionally.
try {
  sqlite.exec(`ALTER TABLE nodes ADD COLUMN additional_context_node_ids TEXT;`);
} catch {
  // Column already exists — fine, ignore.
}

export const db = drizzle(sqlite, { schema });
