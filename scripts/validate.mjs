import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageManager = process.env.npm_execpath;

if (!packageManager) {
  console.error("Unable to locate pnpm. Run validation with `pnpm validate`.");
  process.exit(1);
}

const commands = [
  ["exec", "tsx", "src/cli.ts", "validate", "."],
  ["run", "typecheck"],
  ["run", "test"],
];

if (process.argv.includes("--build")) commands.push(["run", "build"]);

for (const args of commands) {
  const result = spawnSync(process.execPath, [packageManager, ...args], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
