import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { adapters, detectAdapters, findAdapterCollisions } from "../src/adapters/index.js";
import { analyzeProject } from "../src/analyzer/index.js";
import { createManifest } from "../src/generator.js";
import { loadCatalog } from "../src/catalog/index.js";
import { makeTempProject, removeTempProjects } from "./helpers.js";

afterEach(removeTempProjects);

describe("tool adapters", () => {
  it("detects existing tool markers instead of returning placeholders", async () => {
    const root = await makeTempProject();
    await mkdir(path.join(root, ".cursor"), { recursive: true });
    await mkdir(path.join(root, ".claude"), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "tool-fixture" }));
    const project = await analyzeProject(root);

    expect(await detectAdapters(project)).toEqual(["claude", "cursor"]);
  });

  it("generates genuinely tool-specific instructions", async () => {
    const root = await makeTempProject();
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "adapter-fixture", dependencies: { react: "19.0.0" } }));
    const project = await analyzeProject(root);
    const catalog = await loadCatalog();
    const manifest = createManifest(project, catalog.agents, catalog.skills, ["claude", "copilot"]);
    const claude = (await adapters.claude.generate(manifest, project))[0];
    const copilot = (await adapters.copilot.generate(manifest, project))[0];

    expect(claude?.path).toBe("CLAUDE.md");
    expect(claude?.content).toContain("Before editing");
    expect(copilot?.path).toBe(".github/copilot-instructions.md");
    expect(copilot?.content).toContain("Prefer repository patterns");
    expect(claude?.content).not.toBe(copilot?.content);
  });

  it("reports shared output paths instead of silently hiding adapter collisions", () => {
    expect(findAdapterCollisions(["codex", "opencode"])).toEqual([
      { path: "AGENTS.md", adapters: ["codex", "opencode"] },
    ]);
  });
});
