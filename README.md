# agent-workspace

**Give your coding agent a team, not another prompt.**

[![CI](https://github.com/VietHann/agent-workspace/actions/workflows/ci.yml/badge.svg)](https://github.com/VietHann/agent-workspace/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-0f766e.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20-339933.svg?logo=node.js&logoColor=white)](package.json)
[![TypeScript](https://img.shields.io/badge/built%20with-TypeScript-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-2563eb.svg)](CONTRIBUTING.md)

Turn Codex, Claude Code, Cursor, GitHub Copilot, Gemini CLI, or OpenCode into a repository-aware AI engineering team.

```bash
npx github:VietHann/agent-workspace init
```

```text
Detected stack

Next.js                 (package.json:next)
TypeScript              (tsconfig.json or package.json)
Supabase                (package.json:@supabase/supabase-js)
Vitest                  (package.json:vitest)
pnpm                    (pnpm-lock.yaml)

Creating your AI engineering team...

✓ Architect
✓ Implementation Engineer
✓ Reviewer
✓ Test Engineer
✓ Debugger
✓ Security Reviewer

✓ 24 files created
Context coverage: 100/100

Your AI engineering workspace is ready.
```

No account. No API key. No agent replacement. `agent-workspace` analyzes the codebase, writes a vendor-neutral engineering workspace, and connects it to the coding tools you already use.

## Stop repeating the repository every session

Without a workspace:

```text
“Read the repository first.”
“Remember we use pnpm.”
“Do not introduce Redux.”
“Follow our existing API pattern.”
“Run tests before finishing.”
“Review your own code.”
```

With a workspace:

```text
> Implement subscription billing.

Architect          → maps affected systems and contracts
Implementation     → follows the repository's existing patterns
Test Engineer      → adds behavior-focused coverage
Security Reviewer  → checks authorization and trust boundaries
Reviewer           → catches regressions before the PR

✓ ready for review
```

This is not a prompt collection. Roles and skills have versioned schemas, required context, ordered workflows, constraints, expected outputs, validation checks, and failure conditions. They are inspectable, testable, forkable project assets.

## What it creates

```text
.agent-workspace/
├── workspace.yaml          # pinned canonical manifest
├── context/
│   ├── project.md          # readable facts, evidence, commands, conventions
│   └── project.json        # machine-readable analysis
├── agents/                 # six differentiated engineering roles
└── skills/                 # ten reproducible engineering workflows

AGENTS.md                   # Codex and OpenCode
CLAUDE.md                   # Claude Code
GEMINI.md                   # Gemini CLI
.cursor/rules/              # Cursor
.github/copilot-instructions.md
```

The `.agent-workspace/` directory is the source of truth. Tool files are thin adapters, so your engineering system stays portable instead of drifting into six copies.

Analysis is deliberately honest:

- **Detected facts** include their source, such as `package.json:vitest`.
- **Inferred conventions** are marked provisional.
- **Editable recommendations** are never presented as repository truth.

Existing files are preserved by default. Use `--dry-run` to preview or `--force` when you intentionally want to replace conflicts.

## Quick start

Node.js 20 or newer is required.

```bash
cd your-project
npx github:VietHann/agent-workspace init
npx github:VietHann/agent-workspace doctor
```

Choose specific integrations when you do not want all adapters:

```bash
npx github:VietHann/agent-workspace init --tools codex,claude,cursor
```

Inspect without writing:

```bash
npx github:VietHann/agent-workspace analyze
npx github:VietHann/agent-workspace analyze --json
```

## Your default engineering team

| Role | Job |
|---|---|
| Architect | Maps boundaries, dependencies, tradeoffs, and migration risk |
| Implementation Engineer | Delivers scoped changes using repository patterns |
| Reviewer | Finds concrete correctness and regression issues |
| Test Engineer | Builds robust coverage around behavior and boundaries |
| Debugger | Reproduces failures and proves root-cause fixes |
| Security Reviewer | Traces trust, authorization, input, secrets, and insecure defaults |

The roles are intentionally few. They differ in evidence, workflow, and output—not personality theater.

## Ten skills that ship with 0.1

`build-feature`, `debug`, `review-pr`, `write-tests`, `refactor`, `security-review`, `performance-review`, `design-api`, `database-migration`, and `ship`.

Each skill lives in one folder with a strict `skill.yaml`:

```yaml
kind: skill
schemaVersion: "1"
name: review-pr
version: 1.0.0
description: Perform a production-grade change review focused on correctness and regressions.
requiredContext: [change intent, complete diff, project context]
workflow:
  - id: understand-intent
    action: Reconstruct intended behavior from the change and repository evidence.
  - id: inspect-diff
    action: Read every changed file and trace affected consumers.
constraints:
  - Do not report style preferences as defects.
outputs: [severity-ranked actionable findings]
validation:
  - Every finding explains a concrete failure scenario.
failureConditions:
  - The diff is incomplete.
```

Install a bundled skill into an initialized workspace:

```bash
npx github:VietHann/agent-workspace add security-review
```

## CLI

```text
agent-workspace init [path]       Analyze and generate a workspace
agent-workspace analyze [path]    Inspect without writing
agent-workspace add <skill>       Add a bundled skill
agent-workspace list              List bundled extensions
agent-workspace doctor [path]     Check workspace integrity
agent-workspace validate [path]   Validate contribution schemas
```

`init` and `analyze` support machine-readable JSON. Generated output is deterministic apart from the recorded analysis timestamp.

## Make it yours

The workspace is meant to evolve with your codebase. Edit the generated roles and skills, add organization rules, or fork this repository to maintain your own catalog:

```text
fork
  ↓
copy templates/skill
  ↓
edit one skill.yaml
  ↓
pnpm validate
  ↓
open a PR
```

Useful forks can encode internal security policy, deployment procedures, framework practices, architecture decisions, or private roles. Git is the registry for 0.1: extensions stay reviewable, versioned, and easy to share.

## Architecture

```text
repository → evidence-based analyzer → canonical workspace → thin tool adapters
                                      ↘ roles + skills
```

The MVP is a single TypeScript package with clear internal boundaries. Adapters return generated files but never write them; one generator handles path safety, deterministic ordering, and conflicts. Read the full [product and architecture specification](docs/product-spec.md).

## Contributing

Community extensions are a core product surface. Add skills, agents, detectors, framework packs, adapters, rules, examples, or validation improvements. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the files in [`templates/`](templates/).

```bash
pnpm install
pnpm validate
pnpm build
```

The contribution bar is usefulness and reproducibility: concrete context, an ordered workflow, explicit constraints, meaningful validation, and honest failure conditions.

Not ready to open a PR? Start a [discussion](https://github.com/VietHann/agent-workspace/discussions), report a [bug](https://github.com/VietHann/agent-workspace/issues/new?template=bug.yml), or propose an [extension](https://github.com/VietHann/agent-workspace/issues/new?template=extension.yml).

## Project stewardship

`agent-workspace` is community-driven and currently maintained by [@VietHann](https://github.com/VietHann). The project uses an open roadmap and lightweight maintainer model designed to expand as contributors take sustained ownership.

- [Governance](GOVERNANCE.md)
- [Support](SUPPORT.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## Roadmap

- **0.1:** analyzer, canonical workspace, six roles, ten skills, six tool targets, safe CLI, validation.
- **0.2:** framework packs, Git-based extension sources, monorepo analysis, managed-file update previews.
- **0.3:** a searchable static extension catalog with maintenance and validation signals.

We will not build an IDE, chat app, proprietary cloud, autonomous coding agent, or LLM wrapper. `agent-workspace` organizes and upgrades the tools developers already chose.

## License

[MIT](LICENSE)
