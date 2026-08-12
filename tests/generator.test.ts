import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { afterEach, describe, expect, it } from "vitest";
import { initWorkspace, doctorWorkspace } from "../src/commands.js";
import { workspaceManifestSchema } from "../src/schemas.js";
import { makeTempProject, removeTempProjects } from "./helpers.js";

afterEach(removeTempProjects);

describe("workspace generation", () => {
  it("creates a valid canonical workspace and selected adapters", async () => {
    const root = await makeTempProject();
    await mkdir(path.join(root, "src"));
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "fixture", scripts: { test: "vitest run" }, devDependencies: { typescript: "5.0.0", vitest: "3.0.0" } }));
    const result = await initWorkspace(root, { tools: "codex,cursor" });

    expect(result.write.created.length).toBeGreaterThan(15);
    const manifest = workspaceManifestSchema.parse(YAML.parse(await readFile(path.join(root, ".agent-workspace/workspace.yaml"), "utf8")));
    expect(manifest.agents).toHaveLength(6);
    expect(manifest.skills).toHaveLength(10);
    expect(manifest.adapters).toEqual(["codex", "cursor"]);
    expect(await readFile(path.join(root, "AGENTS.md"), "utf8")).toContain(".agent-workspace/context/project.md");
    expect((await doctorWorkspace(root)).score).toBe(100);
  });

  it("preserves existing unmanaged tool files", async () => {
    const root = await makeTempProject();
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "fixture" }));
    await writeFile(path.join(root, "AGENTS.md"), "# Existing instructions\n");
    const result = await initWorkspace(root, { tools: "codex" });
    expect(result.write.skipped).toContain("AGENTS.md");
    expect(await readFile(path.join(root, "AGENTS.md"), "utf8")).toBe("# Existing instructions\n");
  });

  it("supports dry runs without writing", async () => {
    const root = await makeTempProject();
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "fixture" }));
    const result = await initWorkspace(root, { tools: "claude", dryRun: true });
    expect(result.write.created).toContain("CLAUDE.md");
    await expect(readFile(path.join(root, "CLAUDE.md"), "utf8")).rejects.toThrow();
  });
});
