import { describe, expect, it } from "vitest";
import { loadCatalog } from "../src/catalog/index.js";
import { parseAdapters } from "../src/commands.js";

describe("catalog and command schemas", () => {
  it("loads every bundled extension", async () => {
    const catalog = await loadCatalog();
    expect(catalog.agents).toHaveLength(6);
    expect(catalog.skills).toHaveLength(10);
  });

  it("parses unique adapters and rejects unsupported names", () => {
    expect(parseAdapters("codex,cursor,codex")).toEqual(["codex", "cursor"]);
    expect(() => parseAdapters("unknown")).toThrow(
      "Unknown adapter \"unknown\". Valid adapters: codex, claude, cursor, copilot, gemini, opencode.",
    );
  });
});
