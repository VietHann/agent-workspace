# Contributing to agent-workspace

Thank you for helping build a portable engineering system for coding agents. Contributions are welcome for skills, agents, detectors, adapters, examples, documentation, and validation.

For early design feedback, start a [GitHub Discussion](https://github.com/VietHann/agent-workspace/discussions). Use issues for actionable bugs and accepted feature work.

## Set up

```bash
pnpm install
pnpm validate
pnpm build
```

Run one test file with `pnpm vitest run tests/analyzer.test.ts`.

## Add a skill

1. Copy `templates/skill` to `skills/<kebab-case-name>`.
2. Complete every field in `skill.yaml`.
3. Make workflow steps concrete, ordered, and independently understandable.
4. Include checks that can disprove a false success and failure conditions that stop unsafe work.
5. Run `pnpm validate`.

Skills should encode reusable engineering capabilities, not personas or motivational prompts. Avoid vendor-specific tool names unless the skill explicitly targets that tool.

## Add an agent

Copy `templates/agent/agent.yaml` into `agents/<kebab-case-name>.yaml`. A new role must have a genuinely different responsibility, required context, and output from existing roles.

## Pull requests

Keep each PR focused on one coherent improvement. Explain the user problem, the chosen contract, validation performed, and any compatibility impact. Schema changes must include migration notes and tests because catalogs may be maintained in forks.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Project decisions and maintainer responsibilities are documented in [GOVERNANCE.md](GOVERNANCE.md). Support and vulnerability reports follow [SUPPORT.md](SUPPORT.md) and [SECURITY.md](SECURITY.md).
