# Next.js + Supabase example

This deliberately small fixture demonstrates the complete analyzer surface: Next.js, React, TypeScript strict mode, Supabase, Vitest, pnpm, source and test directories, and package scripts.

From the repository root:

```bash
pnpm dev init examples/next-supabase --tools codex,cursor --dry-run
pnpm dev analyze examples/next-supabase
```

Remove `--dry-run` to generate a real workspace inside the example.
