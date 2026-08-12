import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const roots: string[] = [];

export async function makeTempProject(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-workspace-test-"));
  roots.push(root);
  return root;
}

export async function removeTempProjects(): Promise<void> {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
}
