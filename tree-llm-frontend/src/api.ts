import type { TreeNode, CreateNodeRequest } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

export const api = {
  getTree: (): Promise<TreeNode[]> =>
    fetch(`${BASE_URL}/tree`).then((r) => handle(r)),

  createNode: (req: CreateNodeRequest): Promise<TreeNode> =>
    fetch(`${BASE_URL}/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    }).then((r) => handle(r)),

  deleteNode: (id: string): Promise<{ deleted: string }> =>
    fetch(`${BASE_URL}/nodes/${id}`, { method: "DELETE" }).then((r) => handle(r)),
};
