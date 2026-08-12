import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { ProjectContext, ProjectFact } from "../schemas.js";

const SOURCE_DIRS = ["src", "app", "lib", "packages", "apps", "server", "client", "cmd", "internal"];
const TEST_DIRS = ["test", "tests", "__tests__", "spec", "e2e"];

async function exists(root: string, relative: string): Promise<boolean> {
  try {
    await access(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
}

async function readJson(root: string, relative: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(path.join(root, relative), "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function addFact(facts: ProjectFact[], fact: ProjectFact): void {
  if (!facts.some((candidate) => candidate.category === fact.category && candidate.value === fact.value)) facts.push(fact);
}

function dependencyNames(pkg: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
    const group = pkg[key];
    if (group && typeof group === "object") Object.keys(group).forEach((name) => names.add(name));
  }
  return names;
}

export async function analyzeProject(inputRoot: string): Promise<ProjectContext> {
  const root = path.resolve(inputRoot);
  const pkg = await readJson(root, "package.json");
  const pyproject = (await exists(root, "pyproject.toml")) ? await readFile(path.join(root, "pyproject.toml"), "utf8") : "";
  const facts: ProjectFact[] = [];
  const deps = pkg ? dependencyNames(pkg) : new Set<string>();

  if (pkg) {
    const hasTs = deps.has("typescript") || await exists(root, "tsconfig.json");
    addFact(facts, { category: "language", value: hasTs ? "TypeScript" : "JavaScript", source: hasTs ? "tsconfig.json or package.json" : "package.json", confidence: "detected" });
    const mappings: Array<[string, ProjectFact["category"], string]> = [
      ["next", "framework", "Next.js"], ["react", "framework", "React"], ["vue", "framework", "Vue"], ["svelte", "framework", "Svelte"],
      ["express", "framework", "Express"], ["@nestjs/core", "framework", "NestJS"], ["@supabase/supabase-js", "database", "Supabase"],
      ["prisma", "database", "Prisma"], ["drizzle-orm", "database", "Drizzle"], ["mongodb", "database", "MongoDB"], ["redis", "database", "Redis"],
      ["vitest", "testing", "Vitest"], ["jest", "testing", "Jest"], ["@playwright/test", "testing", "Playwright"],
    ];
    for (const [dependency, category, value] of mappings) if (deps.has(dependency)) addFact(facts, { category, value, source: `package.json:${dependency}`, confidence: "detected" });
  }

  const fileFacts: Array<[string, ProjectFact["category"], string]> = [
    ["go.mod", "language", "Go"], ["Cargo.toml", "language", "Rust"], ["pom.xml", "language", "Java"],
    ["Dockerfile", "infrastructure", "Docker"], ["docker-compose.yml", "infrastructure", "Docker Compose"],
    [".github/workflows", "infrastructure", "GitHub Actions"], ["terraform", "infrastructure", "Terraform"],
  ];
  for (const [file, category, value] of fileFacts) if (await exists(root, file)) addFact(facts, { category, value, source: file, confidence: "detected" });

  if (pyproject || await exists(root, "requirements.txt")) {
    addFact(facts, { category: "language", value: "Python", source: pyproject ? "pyproject.toml" : "requirements.txt", confidence: "detected" });
    if (/fastapi/i.test(pyproject)) addFact(facts, { category: "framework", value: "FastAPI", source: "pyproject.toml", confidence: "detected" });
    if (/django/i.test(pyproject)) addFact(facts, { category: "framework", value: "Django", source: "pyproject.toml", confidence: "detected" });
    if (/pytest/i.test(pyproject)) addFact(facts, { category: "testing", value: "Pytest", source: "pyproject.toml", confidence: "detected" });
  }

  const managers: Array<[string, string]> = [["pnpm-lock.yaml", "pnpm"], ["yarn.lock", "yarn"], ["bun.lock", "bun"], ["bun.lockb", "bun"], ["package-lock.json", "npm"], ["uv.lock", "uv"], ["poetry.lock", "Poetry"]];
  for (const [file, value] of managers) if (await exists(root, file)) addFact(facts, { category: "package-manager", value, source: file, confidence: "detected" });

  const sourceDirectories = (await Promise.all(SOURCE_DIRS.map(async (dir) => [dir, await exists(root, dir)] as const))).filter(([, found]) => found).map(([dir]) => dir);
  const testDirectories = (await Promise.all(TEST_DIRS.map(async (dir) => [dir, await exists(root, dir)] as const))).filter(([, found]) => found).map(([dir]) => dir);
  const packageBoundaries: string[] = [];
  for (const container of ["packages", "apps"]) {
    if (await exists(root, container)) {
      for (const entry of await readdir(path.join(root, container), { withFileTypes: true })) if (entry.isDirectory()) packageBoundaries.push(`${container}/${entry.name}`);
    }
  }

  const commands: ProjectContext["commands"] = [];
  const scripts = pkg?.scripts;
  if (scripts && typeof scripts === "object") for (const [name, command] of Object.entries(scripts)) if (typeof command === "string") commands.push({ name, command, source: "package.json" });

  const conventions: ProjectContext["conventions"] = [];
  if (await exists(root, "tsconfig.json")) {
    const tsconfig = await readJson(root, "tsconfig.json");
    const options = tsconfig?.compilerOptions;
    if (options && typeof options === "object" && "strict" in options && (options as Record<string, unknown>).strict === true) conventions.push({ statement: "TypeScript strict mode is enabled.", source: "tsconfig.json", confidence: "detected" });
  }
  const conventionFiles: Array<[string, string]> = [[".editorconfig", "EditorConfig defines repository formatting."], ["eslint.config.js", "ESLint is configured."], ["eslint.config.mjs", "ESLint is configured."], ["prettier.config.js", "Prettier is configured."], [".prettierrc", "Prettier is configured."]];
  for (const [file, statement] of conventionFiles) if (await exists(root, file)) conventions.push({ statement, source: file, confidence: "detected" });

  const fallbackName = path.basename(root);
  return {
    schemaVersion: "1",
    root,
    name: typeof pkg?.name === "string" ? pkg.name : fallbackName,
    analyzedAt: new Date().toISOString(),
    facts: facts.sort((a, b) => `${a.category}:${a.value}`.localeCompare(`${b.category}:${b.value}`)),
    sourceDirectories: sourceDirectories.sort(),
    testDirectories: testDirectories.sort(),
    packageBoundaries: packageBoundaries.sort(),
    commands: commands.sort((a, b) => a.name.localeCompare(b.name)),
    conventions,
    recommendations: facts.length === 0 ? ["Review this context and document the stack; no supported stack markers were detected."] : ["Review inferred context before relying on it for architecture decisions."],
  };
}
