import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { ProjectContext, ProjectFact } from "../schemas.js";

const SOURCE_DIRS = ["src", "app", "lib", "server", "client", "cmd", "internal"];
const TEST_DIRS = ["test", "tests", "__tests__", "spec", "e2e"];
const PACKAGE_CONTAINERS = ["packages", "apps", "services"];
const DEPENDENCY_FACTS: Array<[string, ProjectFact["category"], string]> = [
  ["next", "framework", "Next.js"], ["react", "framework", "React"], ["vue", "framework", "Vue"], ["svelte", "framework", "Svelte"],
  ["express", "framework", "Express"], ["@nestjs/core", "framework", "NestJS"], ["@supabase/supabase-js", "database", "Supabase"],
  ["prisma", "database", "Prisma"], ["@prisma/client", "database", "Prisma"], ["drizzle-orm", "database", "Drizzle"],
  ["pg", "database", "PostgreSQL"], ["mongodb", "database", "MongoDB"], ["redis", "database", "Redis"],
  ["vitest", "testing", "Vitest"], ["jest", "testing", "Jest"], ["@playwright/test", "testing", "Playwright"],
];

async function exists(root: string, relative: string): Promise<boolean> {
  try { await access(path.join(root, relative)); return true; } catch { return false; }
}

async function readJson(root: string, relative: string): Promise<Record<string, unknown> | undefined> {
  try { return JSON.parse(await readFile(path.join(root, relative), "utf8")) as Record<string, unknown>; } catch { return undefined; }
}

function addFact(facts: ProjectFact[], fact: ProjectFact): void {
  if (!facts.some((candidate) => candidate.category === fact.category && candidate.value === fact.value)) facts.push(fact);
}

function dependencyNames(pkg: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  for (const key of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const group = pkg[key];
    if (group && typeof group === "object") Object.keys(group).forEach((name) => names.add(name));
  }
  return names;
}

function workspacePatterns(pkg: Record<string, unknown> | undefined, pnpmWorkspace: string): string[] {
  const value = pkg?.workspaces;
  const npmPatterns = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).packages)
      ? ((value as Record<string, unknown>).packages as unknown[]).filter((item): item is string => typeof item === "string")
      : [];
  const pnpmPatterns = [...pnpmWorkspace.matchAll(/^\s*-\s*['"]?([^'"#\r\n]+)['"]?\s*$/gm)].map((match) => match[1]?.trim()).filter((item): item is string => Boolean(item));
  return [...new Set([...npmPatterns, ...pnpmPatterns])];
}

function patternContainers(patterns: string[]): string[] {
  return patterns.map((pattern) => pattern.replace(/\\/g, "/").split("/")[0]).filter((part): part is string => Boolean(part && !part.includes("*") && part !== "."));
}

async function discoverPackages(root: string, pkg: Record<string, unknown> | undefined, pnpmWorkspace: string): Promise<string[]> {
  const containers = [...new Set([...PACKAGE_CONTAINERS, ...patternContainers(workspacePatterns(pkg, pnpmWorkspace))])];
  const boundaries: string[] = [];
  for (const container of containers) {
    if (!await exists(root, container)) continue;
    for (const entry of await readdir(path.join(root, container), { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const direct = `${container}/${entry.name}`;
      if (await exists(root, `${direct}/package.json`) || await exists(root, `${direct}/pyproject.toml`) || await exists(root, `${direct}/Cargo.toml`) || await exists(root, `${direct}/go.mod`)) boundaries.push(direct);
      for (const nested of await readdir(path.join(root, direct), { withFileTypes: true })) {
        if (!nested.isDirectory() || nested.name.startsWith(".")) continue;
        const nestedPath = `${direct}/${nested.name}`;
        if (await exists(root, `${nestedPath}/package.json`)) boundaries.push(nestedPath);
      }
    }
  }
  return [...new Set(boundaries)].sort();
}

async function collectDirectorySignals(root: string, bases: string[], names: string[]): Promise<string[]> {
  const found: string[] = [];
  for (const base of bases) for (const name of names) {
    const relative = base === "." ? name : `${base}/${name}`;
    if (await exists(root, relative)) found.push(relative);
  }
  return [...new Set(found)].sort();
}

export async function analyzeProject(inputRoot: string): Promise<ProjectContext> {
  const root = path.resolve(inputRoot);
  const pkg = await readJson(root, "package.json");
  const pyproject = await exists(root, "pyproject.toml") ? await readFile(path.join(root, "pyproject.toml"), "utf8") : "";
  const pnpmWorkspace = await exists(root, "pnpm-workspace.yaml") ? await readFile(path.join(root, "pnpm-workspace.yaml"), "utf8") : "";
  const facts: ProjectFact[] = [];
  const packageBoundaries = await discoverPackages(root, pkg, pnpmWorkspace);
  const packageRecords = (await Promise.all(packageBoundaries.map(async (boundary) => ({ boundary, pkg: await readJson(root, `${boundary}/package.json`) })))).filter((item): item is { boundary: string; pkg: Record<string, unknown> } => Boolean(item.pkg));
  const dependencySources = [...(pkg ? [{ boundary: ".", pkg }] : []), ...packageRecords];

  for (const { boundary, pkg: packageJson } of dependencySources) {
    const deps = dependencyNames(packageJson);
    const source = boundary === "." ? "package.json" : `${boundary}/package.json`;
    const hasTs = deps.has("typescript") || await exists(root, boundary === "." ? "tsconfig.json" : `${boundary}/tsconfig.json`);
    addFact(facts, { category: "language", value: hasTs ? "TypeScript" : "JavaScript", source: hasTs ? `${source} or tsconfig.json` : source, confidence: "detected" });
    for (const [dependency, category, value] of DEPENDENCY_FACTS) if (deps.has(dependency)) addFact(facts, { category, value, source: `${source}:${dependency}`, confidence: "detected" });
  }

  const fileFacts: Array<[string, ProjectFact["category"], string]> = [
    ["go.mod", "language", "Go"], ["Cargo.toml", "language", "Rust"], ["pom.xml", "language", "Java"],
    ["Dockerfile", "infrastructure", "Docker"], ["docker-compose.yml", "infrastructure", "Docker Compose"], ["compose.yaml", "infrastructure", "Docker Compose"],
    [".github/workflows", "infrastructure", "GitHub Actions"], ["terraform", "infrastructure", "Terraform"], ["k8s", "infrastructure", "Kubernetes"], ["helm", "infrastructure", "Helm"],
  ];
  for (const [file, category, value] of fileFacts) if (await exists(root, file)) addFact(facts, { category, value, source: file, confidence: "detected" });
  if (packageBoundaries.length > 0) addFact(facts, { category: "tooling", value: "Workspace/monorepo", source: pnpmWorkspace ? "pnpm-workspace.yaml" : "package.json workspaces or package containers", confidence: "detected" });

  if (pyproject || await exists(root, "requirements.txt")) {
    addFact(facts, { category: "language", value: "Python", source: pyproject ? "pyproject.toml" : "requirements.txt", confidence: "detected" });
    if (/fastapi/i.test(pyproject)) addFact(facts, { category: "framework", value: "FastAPI", source: "pyproject.toml", confidence: "detected" });
    if (/django/i.test(pyproject)) addFact(facts, { category: "framework", value: "Django", source: "pyproject.toml", confidence: "detected" });
    if (/pytest/i.test(pyproject)) addFact(facts, { category: "testing", value: "Pytest", source: "pyproject.toml", confidence: "detected" });
  }

  const managers: Array<[string, string]> = [["pnpm-lock.yaml", "pnpm"], ["yarn.lock", "yarn"], ["bun.lock", "bun"], ["bun.lockb", "bun"], ["package-lock.json", "npm"], ["uv.lock", "uv"], ["poetry.lock", "Poetry"]];
  for (const [file, value] of managers) if (await exists(root, file)) addFact(facts, { category: "package-manager", value, source: file, confidence: "detected" });

  const bases = [".", ...packageBoundaries];
  const sourceDirectories = await collectDirectorySignals(root, bases, SOURCE_DIRS);
  const testDirectories = await collectDirectorySignals(root, bases, TEST_DIRS);
  const commands: ProjectContext["commands"] = [];
  for (const { boundary, pkg: packageJson } of dependencySources) {
    const scripts = packageJson.scripts;
    if (!scripts || typeof scripts !== "object") continue;
    const source = boundary === "." ? "package.json" : `${boundary}/package.json`;
    for (const [name, command] of Object.entries(scripts)) if (typeof command === "string") commands.push({ name: boundary === "." ? name : `${boundary}:${name}`, command, source });
  }

  const conventions: ProjectContext["conventions"] = [];
  for (const base of bases) {
    const tsconfigPath = base === "." ? "tsconfig.json" : `${base}/tsconfig.json`;
    if (!await exists(root, tsconfigPath)) continue;
    const tsconfig = await readJson(root, tsconfigPath);
    const options = tsconfig?.compilerOptions;
    if (options && typeof options === "object" && (options as Record<string, unknown>).strict === true) conventions.push({ statement: `TypeScript strict mode is enabled${base === "." ? "" : ` in ${base}`}.`, source: tsconfigPath, confidence: "detected" });
  }
  const conventionFiles: Array<[string, string]> = [[".editorconfig", "EditorConfig defines repository formatting."], ["eslint.config.js", "ESLint is configured."], ["eslint.config.mjs", "ESLint is configured."], ["prettier.config.js", "Prettier is configured."], [".prettierrc", "Prettier is configured."], ["biome.json", "Biome is configured."]];
  for (const [file, statement] of conventionFiles) if (await exists(root, file)) conventions.push({ statement, source: file, confidence: "detected" });

  return {
    schemaVersion: "1",
    root,
    name: typeof pkg?.name === "string" ? pkg.name : path.basename(root),
    analyzedAt: new Date().toISOString(),
    facts: facts.sort((a, b) => `${a.category}:${a.value}`.localeCompare(`${b.category}:${b.value}`)),
    sourceDirectories,
    testDirectories,
    packageBoundaries,
    commands: commands.sort((a, b) => a.name.localeCompare(b.name)),
    conventions: conventions.sort((a, b) => a.source.localeCompare(b.source)),
    recommendations: facts.length === 0
      ? ["Review this context and document the stack; no supported stack markers were detected."]
      : ["Treat dependency and file signals as repository evidence, not proof of runtime architecture.", ...(packageBoundaries.length > 0 ? ["Review each detected package boundary; workspace discovery is intentionally bounded and does not parse source ASTs."] : [])],
  };
}
