import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { agentSchema, skillSchema, type AgentDefinition, type SkillDefinition } from "../schemas.js";

async function findCatalogRoot(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [process.cwd(), path.resolve(here, ".."), path.resolve(here, "../..")];
  for (const candidate of candidates) {
    try {
      await readdir(path.join(candidate, "agents"));
      await readdir(path.join(candidate, "skills"));
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error("Could not locate the bundled agent-workspace catalog.");
}

export async function loadCatalog(catalogRoot?: string): Promise<{ agents: AgentDefinition[]; skills: SkillDefinition[]; root: string }> {
  const root = catalogRoot ?? await findCatalogRoot();
  const agentFiles = (await readdir(path.join(root, "agents"))).filter((file) => file.endsWith(".yaml")).sort();
  const skillFolders = (await readdir(path.join(root, "skills"), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const agents = await Promise.all(agentFiles.map(async (file) => agentSchema.parse(YAML.parse(await readFile(path.join(root, "agents", file), "utf8")))));
  const skills = await Promise.all(skillFolders.map(async (folder) => skillSchema.parse(YAML.parse(await readFile(path.join(root, "skills", folder, "skill.yaml"), "utf8")))));
  return { agents, skills, root };
}
