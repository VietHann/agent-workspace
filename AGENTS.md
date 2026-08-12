# Repository Guidelines

## Project Structure & Module Organization

This is a single TypeScript package, not a monorepo. `src/analyzer/` collects repository evidence into `ProjectContext`; `src/catalog/` loads and validates repository-owned YAML; `src/generator.ts` creates canonical files and owns safe writes; and `src/adapters/` translates the manifest into vendor entry points without writing directly. `src/commands.ts` exposes reusable command operations, while `src/cli.ts` contains terminal presentation.

Built-in definitions live in `agents/*.yaml` and `skills/<name>/skill.yaml`. Keep these as data rather than embedding their content in TypeScript. `templates/` is the contribution starting surface. `examples/next-supabase/` is both a representative fixture and a checked-in generated workspace. Tests in `tests/` cover schemas, analysis, generation, and real CLI execution.

## Build, Test, and Development Commands

- `pnpm dev -- <command>` runs the source CLI, for example `pnpm dev -- analyze .`.
- `pnpm typecheck` runs strict TypeScript checking without emitting files.
- `pnpm test` runs all Vitest tests once.
- `pnpm vitest run tests/analyzer.test.ts` runs one test file.
- `pnpm validate` validates catalog schemas, type-checks, and runs tests.
- `pnpm build` bundles ESM executables and declarations into `dist/` with tsup.

## Coding Style & Naming Conventions

TypeScript uses strict mode, NodeNext modules, two-space indentation, and explicit `.js` suffixes in source imports. Extension names and workflow IDs are lowercase kebab-case; extension versions are semantic versions. Zod schemas are strict, so public format changes require deliberate schema and fixture updates. Preserve deterministic sorting in analysis and generation. All writes must remain inside the target repository and must preserve conflicts unless the caller selects force.

## Testing Guidelines

Vitest runs in the Node environment. Use temporary directories from `tests/helpers.ts` for filesystem behavior and clean them after each test. Test both observable files and parsed schemas. CLI behavior changes require a child-process test, not only direct function coverage.

## Pull Request Guidelines

Use `.github/PULL_REQUEST_TEMPLATE.md`: explain the user problem, behavioral contract, validation, compatibility, and risk. Run `pnpm validate` before opening a PR.
