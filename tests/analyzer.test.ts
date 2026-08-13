import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { makeTempProject, removeTempProjects } from "./helpers.js";
import { analyzeProject } from "../src/analyzer/index.js";
import { contextCoverageScore } from "../src/commands.js";

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

  it("rejects missing paths and files instead of treating them as empty repositories", async () => {
    const root = await makeTempProject();
    await expect(analyzeProject(path.join(root, "missing"))).rejects.toThrow(/does not exist/i);
    const file = path.join(root, "README.md");
    await writeFile(file, "# fixture\n");
    await expect(analyzeProject(file)).rejects.toThrow(/not a directory/i);
  });

  it("discovers bounded monorepo packages and their stack signals", async () => {
    const root = await makeTempProject();
    await mkdir(path.join(root, "apps", "web", "src"), { recursive: true });
    await mkdir(path.join(root, "packages", "api", "tests"), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "workspace", private: true, workspaces: ["apps/*", "packages/*"], scripts: { test: "pnpm -r test" } }));
    await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - 'apps/*'\n  - 'packages/*'\n");
    await writeFile(path.join(root, "apps", "web", "package.json"), JSON.stringify({ name: "@workspace/web", scripts: { build: "next build" }, dependencies: { next: "15.0.0", react: "19.0.0" }, devDependencies: { typescript: "5.0.0" } }));
    await writeFile(path.join(root, "apps", "web", "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true } }));
    await writeFile(path.join(root, "packages", "api", "package.json"), JSON.stringify({ name: "@workspace/api", scripts: { test: "vitest run" }, dependencies: { express: "5.0.0", pg: "8.0.0" }, devDependencies: { vitest: "3.0.0" } }));

    const result = await analyzeProject(root);

    expect(result.packageBoundaries).toEqual(["apps/web", "packages/api"]);
    expect(result.sourceDirectories).toContain("apps/web/src");
    expect(result.testDirectories).toContain("packages/api/tests");
    expect(result.facts.map((fact) => fact.value)).toEqual(expect.arrayContaining(["Workspace/monorepo", "Next.js", "Express", "PostgreSQL", "Vitest"]));
    expect(result.commands).toContainEqual({ name: "apps/web:build", command: "next build", source: "apps/web/package.json" });
    expect(result.conventions).toContainEqual({ statement: "TypeScript strict mode is enabled in apps/web.", source: "apps/web/tsconfig.json", confidence: "detected" });
  });

  it("discovers declared Cargo, Go, and Maven workspace members", async () => {
    const root = await makeTempProject();
    await mkdir(path.join(root, "crates", "core", "src"), { recursive: true });
    await mkdir(path.join(root, "go-services", "api"), { recursive: true });
    await mkdir(path.join(root, "java-services", "billing"), { recursive: true });
    await writeFile(path.join(root, "Cargo.toml"), '[workspace]\nmembers = ["crates/*"]\n');
    await writeFile(path.join(root, "crates", "core", "Cargo.toml"), '[package]\nname = "core"\nversion = "0.1.0"\n');
    await writeFile(path.join(root, "go.work"), "go 1.22\n\nuse (\n  ./go-services/api\n)\n");
    await writeFile(path.join(root, "go-services", "api", "go.mod"), "module example.com/api\n");
    await writeFile(path.join(root, "pom.xml"), "<project><modules><module>java-services/billing</module></modules></project>");
    await writeFile(path.join(root, "java-services", "billing", "pom.xml"), "<project />");

    const result = await analyzeProject(root);

    expect(result.packageBoundaries).toEqual(["crates/core", "go-services/api", "java-services/billing"]);
    expect(result.facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "Rust", source: "crates/core/Cargo.toml" }),
      expect.objectContaining({ value: "Go", source: "go-services/api/go.mod" }),
      expect.objectContaining({ value: "Java", source: "java-services/billing/pom.xml" }),
    ]));
  });

  it("scores context coverage across every package boundary", async () => {
    const root = await makeTempProject();
    for (const name of ["a", "b", "c"]) {
      await mkdir(path.join(root, "packages", name, "src"), { recursive: true });
      await writeFile(path.join(root, "packages", name, "package.json"), JSON.stringify({
        name,
        scripts: { build: "tsc" },
        devDependencies: { typescript: "5.0.0" },
      }));
    }
    await mkdir(path.join(root, "packages", "a", "tests"));
    const project = await analyzeProject(root);

    expect(contextCoverageScore(project)).toBe(67);
  });
});
