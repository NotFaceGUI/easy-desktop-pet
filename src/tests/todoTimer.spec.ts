import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../constants";
import {
  formatSeconds,
  getInitialTodoTimerState,
  getTodoCompletedAction,
  getTodoRunningAction,
} from "../lib/todoTimer";

describe("todo timer helpers", () => {
  it("creates initial state from config", () => {
    const state = getInitialTodoTimerState(DEFAULT_CONFIG.todoTimer);
    expect(state.remainingSeconds).toBe(25 * 60);
    expect(state.completed).toBe(false);
  });

  it("resolves running and completed action ids", () => {
    expect(getTodoRunningAction(DEFAULT_CONFIG)).toBe("supervise");
    expect(getTodoCompletedAction(DEFAULT_CONFIG)).toBe("idle");
  });

  it("formats seconds to mm:ss", () => {
    expect(formatSeconds(125)).toBe("02:05");
  });
});
