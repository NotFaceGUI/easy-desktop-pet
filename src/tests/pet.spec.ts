import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../constants";
import { resolveActionAsset } from "../lib/pet";

describe("resolveActionAsset", () => {
  it("returns mapped asset for known action", () => {
    const asset = resolveActionAsset(DEFAULT_CONFIG, "idle");
    expect(asset?.id).toBe("cat-idle");
  });

  it("falls back to default action when selected action is empty", () => {
    const asset = resolveActionAsset(DEFAULT_CONFIG, "sit");
    expect(asset?.id).toBe("cat-sit");
  });
});
