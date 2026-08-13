import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { adapterOutputPaths, detectAdapters } from "./adapters/index.js";
import { analyzeProject } from "./analyzer/index.js";
import { loadCatalog } from "./catalog/index.js";
import { buildGeneratedFiles, createManifest, workspaceExists, writeGeneratedFiles, type WriteResult } from "./generator.js";
import { adapterNameSchema, workspaceManifestSchema, type AdapterName, type ProjectContext } from "./schemas.js";

export const ALL_ADAPTERS: AdapterName[] = ["codex", "claude", "cursor", "copilot", "gemini", "opencode"];

export interface InitOptions { tools?: string; force?: boolean; dryRun?: boolean }
export interface InitResult {
  project: ProjectContext;
  write: WriteResult;
  adapters: AdapterName[];
  adapterSelection: "detected" | "fallback" | "explicit";
  score: number;
}

export function parseAdapters(input = "all"): AdapterName[] {
  if (input === "all") return ALL_ADAPTERS;
  const names = input.split(",").map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) throw new Error("Choose at least one adapter.");
  return [...new Set(names.map((name) => adapterNameSchema.parse(name)))];
}

export async function resolveAdapters(project: ProjectContext, input = "auto"): Promise<{ names: AdapterName[]; selection: InitResult["adapterSelection"] }> {
  if (input !== "auto") return { names: parseAdapters(input), selection: "explicit" };
  const detected = await detectAdapters(project);
  const existing = await readExistingAdapters(project.root);
  const names = ALL_ADAPTERS.filter((name) => detected.includes(name) || existing.includes(name));
  return names.length > 0
    ? { names, selection: "detected" }
    : { names: ALL_ADAPTERS, selection: "fallback" };
}

async function readExistingAdapters(root: string): Promise<AdapterName[]> {
  try {
    const manifestPath = path.join(root, ".agent-workspace", "workspace.yaml");
    const parsed = workspaceManifestSchema.safeParse(YAML.parse(await readFile(manifestPath, "utf8")));
    return parsed.success ? parsed.data.adapters : [];
  } catch {
    return [];
  }
}

export function contextCoverageScore(project: ProjectContext): number {
  const checks = [project.facts.length > 0, project.commands.length > 0, project.sourceDirectories.length > 0, project.testDirectories.length > 0, project.conventions.length > 0];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function initWorkspace(inputRoot: string, options: InitOptions = {}): Promise<InitResult> {
  const root = path.resolve(inputRoot);
  const project = await analyzeProject(root);
  const catalog = await loadCatalog();
  const selected = await resolveAdapters(project, options.tools);
  const files = await buildGeneratedFiles(project, catalog.agents, catalog.skills, selected.names);
  const write = await writeGeneratedFiles(root, files, options);
  return { project, write, adapters: selected.names, adapterSelection: selected.selection, score: contextCoverageScore(project) };
}

export async function addSkill(inputRoot: string, skillName: string): Promise<"added" | "present"> {
  const root = path.resolve(inputRoot);
  if (!await workspaceExists(root)) throw new Error("No workspace found. Run `agent-workspace init` first.");
  const catalog = await loadCatalog();
  const skill = catalog.skills.find((item) => item.name === skillName);
  if (!skill) throw new Error(`Unknown skill "${skillName}". Run \`agent-workspace list\` to see available skills.`);
  const manifestPath = path.join(root, ".agent-workspace", "workspace.yaml");
  const manifest = workspaceManifestSchema.parse(YAML.parse(await readFile(manifestPath, "utf8")));
  if (manifest.skills.some((item) => item.name === skill.name)) return "present";
  manifest.skills.push({ name: skill.name, version: skill.version });
  manifest.skills.sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(manifestPath, YAML.stringify(manifest, { lineWidth: 100 }), "utf8");
  await writeGeneratedFiles(root, [{ path: `.agent-workspace/skills/${skill.name}/skill.yaml`, content: YAML.stringify(skill, { lineWidth: 100 }), managed: true }], { force: true });
  return "added";
}

async function fileExists(file: string): Promise<boolean> {
  try { await access(file); return true; } catch { return false; }
}

export interface DoctorResult { passed: string[]; failed: string[]; score: number }

export async function doctorWorkspace(inputRoot: string): Promise<DoctorResult> {
  const root = path.resolve(inputRoot);
  const passed: string[] = [];
  const failed: string[] = [];
  const manifestPath = path.join(root, ".agent-workspace", "workspace.yaml");
  let manifest;
  try {
    manifest = workspaceManifestSchema.parse(YAML.parse(await readFile(manifestPath, "utf8")));
    passed.push("workspace manifest is valid");
  } catch (error) {
    failed.push(`workspace manifest is missing or invalid: ${error instanceof Error ? error.message : String(error)}`);
    return { passed, failed, score: 0 };
  }
  const contextExists = await fileExists(path.join(root, ".agent-workspace", "context", "project.md"));
  (contextExists ? passed : failed).push(contextExists ? "project context exists" : "project context is missing");
  const agentsExist = (await Promise.all(manifest.agents.map((item) => fileExists(path.join(root, ".agent-workspace", "agents", `${item.name}.md`))))).every(Boolean);
  (agentsExist ? passed : failed).push(agentsExist ? "all agent files exist" : "one or more agent files are missing");
  const skillsExist = (await Promise.all(manifest.skills.map((item) => fileExists(path.join(root, ".agent-workspace", "skills", item.name, "skill.yaml"))))).every(Boolean);
  (skillsExist ? passed : failed).push(skillsExist ? "all skill files exist" : "one or more skill files are missing");
  const adapterPaths = [...new Set(manifest.adapters.map((name) => adapterOutputPaths[name]))];
  const adaptersExist = (await Promise.all(adapterPaths.map((relative) => fileExists(path.join(root, relative))))).every(Boolean);
  (adaptersExist ? passed : failed).push(adaptersExist ? "all adapter entry points exist" : "one or more adapter entry points are missing");
  const total = passed.length + failed.length;
  return { passed, failed, score: total === 0 ? 0 : Math.round((passed.length / total) * 100) };
}

export async function validateCatalog(inputRoot: string): Promise<{ agents: number; skills: number }> {
  const catalog = await loadCatalog(path.resolve(inputRoot));
  const names = [...catalog.agents.map((item) => `agent:${item.name}`), ...catalog.skills.map((item) => `skill:${item.name}`)];
  if (new Set(names).size !== names.length) throw new Error("Duplicate extension names found.");
  return { agents: catalog.agents.length, skills: catalog.skills.length };
}

export { analyzeProject, loadCatalog };
