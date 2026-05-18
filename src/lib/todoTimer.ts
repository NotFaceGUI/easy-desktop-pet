import type { AppConfig, TodoTimerRuntimeState, TodoTimerSettings } from "../types";

export function getInitialTodoTimerState(
  settings: TodoTimerSettings,
): TodoTimerRuntimeState {
  return {
    isRunning: false,
    remainingSeconds: settings.minutes * 60,
    completed: false,
  };
}

export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.max(totalSeconds % 60, 0)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function getTodoRunningAction(config: AppConfig): string {
  return config.todoTimer.runningActionId || config.settings.defaultActionId || "idle";
}

export function getTodoCompletedAction(config: AppConfig): string {
  return config.todoTimer.completedActionId || config.settings.defaultActionId || "idle";
}
