import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../constants";
import { hasActionAssets, resolveActionAsset, resolveRenderableActionId } from "../lib/pet";

describe("resolveActionAsset", () => {
  it("returns mapped asset for known action", () => {
    const asset = resolveActionAsset(DEFAULT_CONFIG, "idle");
    expect(asset?.id).toBe("cat-idle");
  });

  it("falls back to default action when selected action is empty", () => {
    const asset = resolveActionAsset(DEFAULT_CONFIG, "sit");
    expect(asset?.id).toBe("cat-sit");
  });

  it("marks actions without valid assets as unavailable", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.assets = config.assets.filter((asset) => asset.id !== "cat-play");
    expect(hasActionAssets(config, "play")).toBe(false);
  });

  it("falls back to the next renderable action when default assets are missing", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.assets = config.assets.filter((asset) => asset.id !== "cat-idle");

    expect(resolveRenderableActionId(config, "idle")).toBe("sit");
    expect(resolveActionAsset(config, "idle")?.id).toBe("cat-sit");
  });
});
