import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../constants";

describe("default config", () => {
  it("contains bundled cat assets for built-in actions", () => {
    expect(DEFAULT_CONFIG.assets[0]?.id).toBe("cat-idle");
    expect(DEFAULT_CONFIG.assets.map((asset) => asset.id)).toEqual([
      "cat-idle",
      "cat-sit",
      "cat-groom",
      "cat-play",
      "cat-supervise",
    ]);
    expect(DEFAULT_CONFIG.settings.defaultActionId).toBe("idle");
  });
});
