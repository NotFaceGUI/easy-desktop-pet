import { describe, expect, it } from "vitest";
import {
  clampWindowPosition,
  clampWindowPositionByRect,
  layoutFloatingButtons,
  pickNearestBounds,
  reconcileWindowPosition,
  reconcileWindowPositionByRect,
} from "../lib/windowPosition";

describe("window position helpers", () => {
  const size = { width: 200, height: 120 };
  const primaryBounds = { x: 0, y: 0, width: 1920, height: 1040 };
  const secondaryBounds = { x: 1920, y: 0, width: 1600, height: 900 };

  it("clamps dragging within the current work area", () => {
    expect(
      clampWindowPosition({ x: -50, y: 1200 }, size, primaryBounds),
    ).toEqual({ x: 0, y: 920 });
  });

  it("chooses the nearest visible monitor bounds", () => {
    expect(
      pickNearestBounds({ x: 2500, y: 100 }, [primaryBounds, secondaryBounds]),
    ).toEqual(secondaryBounds);
  });

  it("reconciles saved positions back into a visible work area", () => {
    expect(
      reconcileWindowPosition({ x: 5000, y: -200 }, size, [primaryBounds, secondaryBounds]),
    ).toEqual({ x: 3320, y: 0 });
  });

  it("clamps using the visible pet rect instead of the full window", () => {
    expect(
      clampWindowPositionByRect(
        { x: -200, y: -120 },
        { left: 140, top: 80, width: 220, height: 180 },
        primaryBounds,
        1,
        12,
      ),
    ).toEqual({ x: -128, y: -68 });
  });

  it("reconciles by the nearest screen using the pet rect center", () => {
    expect(
      reconcileWindowPositionByRect(
        { x: 3500, y: 920 },
        { left: 120, top: 100, width: 200, height: 160 },
        [primaryBounds, secondaryBounds],
        1,
        12,
      ),
    ).toEqual({ x: 3188, y: 628 });
  });

  it("keeps each floating button inside viewport bounds", () => {
    expect(
      layoutFloatingButtons(
        [
          { key: "a", desiredX: -30, desiredY: 40, width: 100, height: 40 },
        ],
        { left: 0, top: 0, right: 300, bottom: 240 },
      ),
    ).toEqual([{ key: "a", x: 62, y: 40 }]);
  });

  it("separates overlapping floating buttons independently", () => {
    const result = layoutFloatingButtons(
      [
        { key: "a", desiredX: 100, desiredY: 100, width: 100, height: 40 },
        { key: "b", desiredX: 100, desiredY: 100, width: 100, height: 40 },
      ],
      { left: 0, top: 0, right: 300, bottom: 240 },
    );

    expect(
      result[0]?.x !== result[1]?.x || result[0]?.y !== result[1]?.y,
    ).toBe(true);
  });
});
