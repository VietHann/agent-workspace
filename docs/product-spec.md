# agent-workspace: Product and MVP Specification

## Critical product analysis

The opportunity is real: coding agents are capable, but repository knowledge is fragmented across README files, configuration, tribal knowledge, and instructions that developers repeatedly paste into chats. The strongest product is not a multi-agent runtime. It is a portable, inspectable workspace that upgrades the tools developers already use.

The original concept has four important risks:

1. **Prompt-library gravity.** Markdown roles can easily become decorative personas. The MVP counters this with schemas, explicit inputs and outputs, ordered workflows, validation criteria, and failure conditions.
2. **False architectural confidence.** Static analysis cannot reliably infer intent. Generated context therefore labels every statement as a detected fact, inferred convention, or editable recommendation and records its evidence.
3. **Configuration sprawl.** Writing six vendor formats can clutter or damage a repository. Adapters are thin projections of one canonical workspace, generated files are deterministic, and existing files are never overwritten unless explicitly requested.
4. **The “team” metaphor can overpromise orchestration.** The MVP supplies differentiated roles and repeatable workflows; it does not pretend to schedule autonomous agents. Tools that support delegation may use the roles that way, while simpler tools consume them as focused operating modes.

The durable growth loop is: instant repository-specific value, visible and editable artifacts, easy team customization, and low-boilerplate contributions. GitHub acts as the first registry. A hosted marketplace, model routing, autonomous execution, telemetry, and remote services are non-goals for 0.1.

## Final MVP specification

Version 0.1 delivers:

- repository analysis for major JavaScript/TypeScript, Python, Go, Rust, and Java signals;
- a versioned canonical workspace in `.agent-workspace/`;
- six useful roles: architect, implementation engineer, reviewer, test engineer, debugger, and security reviewer;
- ten validated skills;
- adapters for Codex/OpenCode, Claude Code, Cursor, GitHub Copilot, and Gemini CLI;
- `init`, `analyze`, `add`, `list`, `doctor`, and `validate` commands;
- deterministic output and non-destructive conflict handling;
- contribution validation, tests, templates, and an example fixture.

Success is measured by time-to-first-use, truthful analysis, safe installation, useful generated context, and the effort required to add one extension. Download counts and stars are outcomes, not product behavior.

## Architecture

The MVP is one TypeScript package, not a monorepo. Separating packages now would add release and contributor overhead without creating a meaningful boundary.

```text
CLI -> analyzer -> ProjectContext
                  |
catalog + schemas -> Workspace manifest -> generator -> .agent-workspace/
                                             |
                                             +-> adapters -> tool entry points
```

Core boundaries:

- **Analyzer:** read-only evidence collection. Detectors emit facts with source paths and confidence.
- **Schemas:** Zod contracts for projects, skills, agents, workspace manifests, and adapter output.
- **Catalog:** repository-owned agents and skills. These are distributable data, not hard-coded prompts.
- **Generator:** deterministic canonical files. It owns no vendor behavior.
- **Adapters:** pure translations from canonical workspace data to tool-specific files.
- **CLI:** UX, flags, conflict reporting, and exit codes. Business logic remains callable as a library.

## Directory structure

```text
agent-workspace/
├── src/
│   ├── adapters/
│   ├── analyzer/
│   ├── catalog/
│   ├── cli.ts
│   ├── commands.ts
│   ├── generator.ts
│   ├── schemas.ts
│   └── index.ts
├── agents/                  # canonical built-in role definitions
├── skills/                  # canonical built-in skill packages
├── templates/               # contribution starting points
├── examples/                # analyzed project fixture and generated output
├── tests/                   # unit and CLI integration tests
├── docs/
├── .github/
├── AGENTS.md
├── CONTRIBUTING.md
└── README.md
```

## Core schemas

Every extension has a stable `kind`, `schemaVersion`, globally unique `name`, semantic `version`, short description, tags, and optional compatibility metadata. This supports a future registry without introducing one now.

An agent defines responsibilities, required context, operating principles, and expected outputs. A skill defines required context, an ordered workflow of concrete steps, constraints, outputs, validation checks, and explicit failure conditions. A project fact contains a category, value, evidence source, and confidence. A workspace manifest pins selected extensions and adapters so regeneration is repeatable.

Unknown fields are rejected during contribution validation. Generated manifests preserve extension versions. Names use lowercase kebab-case. References are validated against the bundled catalog.

## CLI command design

### `agent-workspace init [path]`

Analyzes a repository, shows the detected stack, creates the canonical workspace, and generates adapter entry points. It is non-interactive by default so `npx github:VietHann/agent-workspace init` works in terminals and CI before the scoped npm package is published. Options include `--tools`, `--force`, `--dry-run`, and `--json`. Existing unmanaged files are skipped unless `--force` is supplied.

### `agent-workspace analyze [path]`

Prints facts, inferences, commands, and evidence without writing files. `--json` makes it scriptable.

### `agent-workspace add <skill> [path]`

Adds one bundled skill to an initialized workspace and updates the manifest. It rejects unknown skills and duplicates cleanly.

### `agent-workspace list`

Lists bundled agents and skills with concise descriptions.

### `agent-workspace doctor [path]`

Checks manifest validity, referenced extensions, expected files, and adapter entry points. The workspace health score is the percentage of explicit integrity checks that pass. Initialization separately reports context coverage from five evidence categories.

### `agent-workspace validate [path]`

Validates contribution catalogs and workspace files. It exits non-zero for schema errors, duplicates, or broken references.

## Initial skills

1. `build-feature` — plan, implement, test, and self-review a scoped feature.
2. `debug` — reproduce a defect, isolate the root cause, and verify the smallest safe fix.
3. `review-pr` — produce severity-ranked, evidence-backed review findings.
4. `write-tests` — identify behavior boundaries and add robust tests.
5. `refactor` — improve structure while preserving observable behavior.
6. `security-review` — inspect trust boundaries, authorization, validation, secrets, and dependencies.
7. `performance-review` — measure first, locate material bottlenecks, and validate improvements.
8. `design-api` — design consistent contracts, failure semantics, compatibility, and examples.
9. `database-migration` — plan reversible schema/data changes with rollout and rollback checks.
10. `ship` — run release gates, summarize risk, and produce a deploy/rollback checklist.

Each skill is intentionally tool-agnostic and has acceptance checks that can be evaluated by a person, agent, or future runner.

## Adapter design

```ts
interface AgentAdapter {
  readonly name: AdapterName;
  readonly displayName: string;
  detect(project: ProjectContext): Promise<boolean>;
  generate(workspace: WorkspaceManifest, project: ProjectContext): Promise<GeneratedFile[]>;
}
```

Adapters return files; they never write them. The generator owns path safety, deterministic ordering, managed headers, conflict policy, and writes. Shared formats are reused: Codex and OpenCode both consume `AGENTS.md`, while each remains a separate adapter identity for future divergence.

## README narrative

The first viewport contains the name, tagline, one-sentence explanation, install command, and a realistic terminal transcript. The next section shows the repeated-instructions problem and the team-based result. Only then does it explain the canonical workspace, supported tools, roles, skills, safety model, customization, architecture, and contribution path. Claims remain concrete and demonstrable; no invented adoption metrics or vague “AI revolution” language.

## Implementation roadmap

### 0.1 — useful local workspace

Schemas, analyzer, deterministic generation, six roles, ten skills, five adapter formats, core commands, validation, tests, example, documentation, and community health files.

### 0.2 — richer detection and composability

Framework packs, extension sources from Git repositories, better monorepo/package-boundary analysis, managed-file three-way updates, and compatibility fixtures for supported tools.

### 0.3 — ecosystem discovery

Signed catalog metadata, searchable static registry, extension scoring based on validation and maintenance signals, and upgrade previews. No hosted account is required.

### Later, only with evidence

Optional execution hooks, workspace evaluation benchmarks, organization policy packs, and deeper tool-specific features. These should be driven by real usage rather than speculative abstraction.
