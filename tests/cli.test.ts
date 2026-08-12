import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { makeTempProject, removeTempProjects } from "./helpers.js";

const exec = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..");
const tsxCli = path.join(repositoryRoot, "node_modules", "tsx", "dist", "cli.mjs");
const workspaceCli = path.join(repositoryRoot, "src", "cli.ts");

afterEach(removeTempProjects);

describe("CLI integration", () => {
  it("runs init and doctor as real commands", async () => {
    const target = await makeTempProject();
    await writeFile(path.join(target, "package.json"), JSON.stringify({ name: "cli-fixture", scripts: { test: "vitest run" }, devDependencies: { vitest: "3.0.0" } }));

    const childOptions = { cwd: repositoryRoot, env: { ...process.env, NODE_ENV: "production" } };
    const initialized = await exec(process.execPath, [tsxCli, workspaceCli, "init", target, "--tools", "claude", "--json"], childOptions);
    const result = JSON.parse(initialized.stdout) as { score: number; write: { created: string[] } };
    expect(result.score).toBe(40);
    expect(result.write.created).toContain("CLAUDE.md");
    expect(await readFile(path.join(target, "CLAUDE.md"), "utf8")).toContain("Claude Code repository instructions");

    const diagnosed = await exec(process.execPath, [tsxCli, workspaceCli, "doctor", target, "--json"], childOptions);
    expect(JSON.parse(diagnosed.stdout)).toMatchObject({ failed: [], score: 100 });
  });
});
