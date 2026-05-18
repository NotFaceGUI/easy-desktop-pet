import { emit, emitTo, listen } from "@tauri-apps/api/event";
import type {
  AppConfig,
  TodoTimerChangedPayload,
  TrayActionPayload,
} from "../types";
import { WINDOW_LABELS } from "../constants";

export const APP_EVENTS = {
  configUpdated: "config-updated",
  todoTimerChanged: "todo-timer-changed",
  trayAction: "tray-action",
} as const;

export async function emitConfigUpdated(config: AppConfig): Promise<void> {
  await Promise.all([
    emitTo(WINDOW_LABELS.pet, APP_EVENTS.configUpdated, config),
    emitTo(WINDOW_LABELS.settings, APP_EVENTS.configUpdated, config),
  ]);
}

export function emitTodoTimerChanged(
  payload: TodoTimerChangedPayload,
): Promise<void> {
  return emit(APP_EVENTS.todoTimerChanged, payload);
}

export async function listenConfigUpdated(
  handler: (config: AppConfig) => void,
): Promise<() => void> {
  return listen<AppConfig>(APP_EVENTS.configUpdated, (event) => handler(event.payload));
}

export async function listenTodoTimerChanged(
  handler: (payload: TodoTimerChangedPayload) => void,
): Promise<() => void> {
  return listen<TodoTimerChangedPayload>(
    APP_EVENTS.todoTimerChanged,
    (event) => handler(event.payload),
  );
}

export async function listenTrayAction(
  handler: (payload: TrayActionPayload) => void,
): Promise<() => void> {
  return listen<TrayActionPayload>(APP_EVENTS.trayAction, (event) => handler(event.payload));
}
