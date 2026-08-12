# Project governance

`agent-workspace` is an open-source project stewarded in public. The governance model is intentionally lightweight for the 0.x stage and is expected to evolve as the contributor community grows.

## Principles

- Product decisions prioritize obvious developer value, simplicity, interoperability, and long-term maintainability.
- Canonical formats remain vendor-neutral. Tool-specific behavior belongs in adapters.
- Repository facts must be evidence-backed; generated guidance must not overstate uncertain inference.
- Extension quality is judged by reproducibility, concrete validation, and safe failure behavior—not prompt length.
- Significant decisions should be visible in issues, discussions, pull requests, or architecture documentation.

## Roles

### Maintainers

Maintainers set release direction, review and merge changes, manage security reports, and protect compatibility. The current maintainer is [@VietHann](https://github.com/VietHann).

### Contributors

Anyone may propose code, documentation, skills, agents, detectors, adapters, examples, or design feedback. Sustained contributors may be invited to become reviewers or maintainers based on demonstrated judgment, respectful collaboration, and continued ownership of a project area.

## Decision process

Routine changes are decided through pull-request review. Changes to public schemas, extension formats, supported runtimes, security posture, or project scope should begin with an issue or discussion and include compatibility consequences. Maintainers seek consensus; when consensus is not possible, they document the decision and reasoning publicly.

## Releases

Releases follow Semantic Versioning. During 0.x, minor versions may introduce format changes, but migration notes are required. Security fixes may be released outside the normal roadmap.

## Changes to governance

Governance changes use the same public pull-request process as code. As the maintainer group grows, this document should define voting, inactive-maintainer status, and succession more formally.
