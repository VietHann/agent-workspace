# Adapter template

Implement the `AgentAdapter` interface from `src/schemas.ts`. An adapter translates a canonical workspace into one tool's preferred entry-point files. It must return files without writing to disk; the shared generator owns path safety, conflicts, and deterministic writes.
