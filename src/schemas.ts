import { z } from "zod";

const kebabName = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, "must be lowercase kebab-case");
const semver = z.string().regex(/^\d+\.\d+\.\d+$/, "must be a semantic version");

export const factSchema = z.object({
  category: z.enum(["language", "framework", "infrastructure", "database", "testing", "package-manager", "tooling"]),
  value: z.string().min(1),
  source: z.string().min(1),
  confidence: z.enum(["detected", "inferred"]),
}).strict();

export const commandSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  source: z.string().min(1),
}).strict();

export const projectContextSchema = z.object({
  schemaVersion: z.literal("1"),
  root: z.string().min(1),
  name: z.string().min(1),
  analyzedAt: z.string().datetime(),
  facts: z.array(factSchema),
  sourceDirectories: z.array(z.string()),
  testDirectories: z.array(z.string()),
  packageBoundaries: z.array(z.string()),
  commands: z.array(commandSchema),
  conventions: z.array(z.object({ statement: z.string(), source: z.string(), confidence: z.enum(["detected", "inferred"]) }).strict()),
  recommendations: z.array(z.string()),
}).strict();

export const agentSchema = z.object({
  kind: z.literal("agent"),
  schemaVersion: z.literal("1"),
  name: kebabName,
  version: semver,
  description: z.string().min(10).max(180),
  tags: z.array(kebabName).default([]),
  responsibilities: z.array(z.string().min(3)).min(2),
  requiredContext: z.array(z.string().min(1)).min(1),
  principles: z.array(z.string().min(3)).min(1),
  outputs: z.array(z.string().min(3)).min(1),
}).strict();

export const skillStepSchema = z.object({
  id: kebabName,
  action: z.string().min(8),
  produces: z.string().min(3).optional(),
}).strict();

export const skillSchema = z.object({
  kind: z.literal("skill"),
  schemaVersion: z.literal("1"),
  name: kebabName,
  version: semver,
  description: z.string().min(10).max(180),
  tags: z.array(kebabName).default([]),
  requiredContext: z.array(z.string().min(1)).min(1),
  workflow: z.array(skillStepSchema).min(3),
  constraints: z.array(z.string().min(3)).min(1),
  outputs: z.array(z.string().min(3)).min(1),
  validation: z.array(z.string().min(3)).min(1),
  failureConditions: z.array(z.string().min(3)).min(1),
}).strict();

export const adapterNameSchema = z.enum(["codex", "claude", "cursor", "copilot", "gemini", "opencode"]);

export const workspaceManifestSchema = z.object({
  kind: z.literal("workspace"),
  schemaVersion: z.literal("1"),
  generator: z.object({ name: z.literal("agent-workspace"), version: semver }).strict(),
  project: z.object({ name: z.string(), root: z.literal(".") }).strict(),
  agents: z.array(z.object({ name: kebabName, version: semver }).strict()),
  skills: z.array(z.object({ name: kebabName, version: semver }).strict()),
  adapters: z.array(adapterNameSchema),
}).strict();

export type ProjectFact = z.infer<typeof factSchema>;
export type ProjectContext = z.infer<typeof projectContextSchema>;
export type AgentDefinition = z.infer<typeof agentSchema>;
export type SkillDefinition = z.infer<typeof skillSchema>;
export type AdapterName = z.infer<typeof adapterNameSchema>;
export type WorkspaceManifest = z.infer<typeof workspaceManifestSchema>;

export interface GeneratedFile {
  path: string;
  content: string;
  managed: boolean;
}

export interface AgentAdapter {
  readonly name: AdapterName;
  readonly displayName: string;
  detect(project: ProjectContext): Promise<boolean>;
  generate(workspace: WorkspaceManifest, project: ProjectContext): Promise<GeneratedFile[]>;
}
