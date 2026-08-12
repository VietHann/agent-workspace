import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { makeTempProject, removeTempProjects } from "./helpers.js";
import { analyzeProject } from "../src/analyzer/index.js";

afterEach(removeTempProjects);

describe("analyzeProject", () => {
  it("detects stack, commands, directories, and strict TypeScript from evidence", async () => {
    const root = await makeTempProject();
    await mkdir(path.join(root, "src"));
    await mkdir(path.join(root, "tests"));
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "sample-app",
      scripts: { test: "vitest run", build: "next build" },
      dependencies: { next: "15.0.0", react: "19.0.0", "@supabase/supabase-js": "2.0.0" },
      devDependencies: { typescript: "5.0.0", vitest: "3.0.0" },
    }));
    await writeFile(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true } }));
    await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

    const result = await analyzeProject(root);

    expect(result.name).toBe("sample-app");
    expect(result.facts.map((fact) => fact.value)).toEqual(expect.arrayContaining(["TypeScript", "Next.js", "React", "Supabase", "Vitest", "pnpm"]));
    expect(result.commands).toContainEqual({ name: "test", command: "vitest run", source: "package.json" });
    expect(result.sourceDirectories).toEqual(["src"]);
    expect(result.testDirectories).toEqual(["tests"]);
    expect(result.conventions[0]?.statement).toBe("TypeScript strict mode is enabled.");
  });

  it("does not invent a stack for an empty repository", async () => {
    const result = await analyzeProject(await makeTempProject());
    expect(result.facts).toEqual([]);
    expect(result.recommendations[0]).toMatch(/no supported stack markers/i);
  });
});
