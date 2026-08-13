# Changelog

All notable changes to `agent-workspace` are documented here. The project follows [Semantic Versioning](https://semver.org/) and uses the structure from [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Planned

- Framework packs and Git-based extension sources.
- Managed-file update previews and compatibility fixtures.
- Deeper language-specific analysis where evidence justifies the added complexity.

## [0.2.0] - 2026-08-13

### Added

- Bounded monorepo discovery for npm/pnpm workspace containers and nested package manifests.
- Package-level framework, database, test, source-directory, test-directory, command, and strict-TypeScript evidence.
- Real adapter detection for Codex, Claude Code, Cursor, GitHub Copilot, Gemini CLI, and OpenCode repository markers.
- Adapter entry-point integrity checks in `doctor`.

### Changed

- `init` now auto-detects existing coding tools and falls back to all adapters when no marker is present.
- Each adapter now emits guidance shaped for its target tool instead of sharing one renamed document.
- Product language now explicitly describes the project as context and workflow scaffolding, not a multi-agent runtime.

## [0.1.1] - 2026-08-12

### Changed

- Moved the npm package name to `@viethann/agent-workspace` because the unscoped `agent-workspace` name belongs to an unrelated package.

### Security

- Overrode the vulnerable transitive `esbuild` range with version 0.28.1 or newer.

## [0.1.0] - 2026-08-12

### Added

- Evidence-based repository analysis for major languages, frameworks, infrastructure, databases, testing tools, and package managers.
- A versioned vendor-neutral workspace schema and deterministic generator.
- Six default engineering roles and ten validated engineering skills.
- Adapters for Codex, Claude Code, Cursor, GitHub Copilot, Gemini CLI, and OpenCode.
- `init`, `analyze`, `add`, `list`, `doctor`, and `validate` commands.
- Cross-platform tests, a generated example workspace, contribution templates, and community health documentation.

[Unreleased]: https://github.com/VietHann/agent-workspace/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/VietHann/agent-workspace/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/VietHann/agent-workspace/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/VietHann/agent-workspace/releases/tag/v0.1.0
