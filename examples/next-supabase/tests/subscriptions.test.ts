import { describe, expect, it } from "vitest";
import { activeSubscriptions } from "../src/subscriptions.js";

describe("activeSubscriptions", () => {
  it("returns active subscriptions", () => {
    expect(activeSubscriptions([{ id: "one", active: true }, { id: "two", active: false }])).toEqual([{ id: "one", active: true }]);
  });
});
