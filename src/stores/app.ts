import { defineStore } from "pinia";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import { DEFAULT_CONFIG, WINDOW_LABELS } from "../constants";
import type { AppConfig, ImportAssetsResult, PetAction, PetAsset, TodoTimerRuntimeState, UpdateInfo } from "../types";
import { emitConfigUpdated, emitTodoTimerChanged } from "../lib/events";
import { importAssets, loadConfig, saveConfig } from "../lib/config";
import {
  formatSeconds,
  getInitialTodoTimerState,
  getTodoCompletedAction,
  getTodoRunningAction,
} from "../lib/todoTimer";
import { hasActionAssets, resolveActionAsset, resolveRenderableActionId } from "../lib/pet";

interface AppState {
  ready: boolean;
  config: AppConfig;
  activeActionId: string;
  currentAsset: PetAsset | null;
  todoTimer: TodoTimerRuntimeState;
  updateInfo: UpdateInfo | null;
  importing: boolean;
}

let timer: number | null = null;

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    ready: false,
    config: structuredClone(DEFAULT_CONFIG),
    activeActionId: DEFAULT_CONFIG.settings.defaultActionId,
    currentAsset: DEFAULT_CONFIG.assets[0] ?? null,
    todoTimer: getInitialTodoTimerState(DEFAULT_CONFIG.todoTimer),
    updateInfo: null,
    importing: false,
  }),
  getters: {
    quickActions(state): PetAction[] {
      return state.config.actions.filter(
        (action) => action.quickAccess && hasActionAssets(state.config, action.id),
      );
    },
    formattedTodoTimer(state): string {
      return formatSeconds(state.todoTimer.remainingSeconds);
    },
  },
  actions: {
    async initialize() {
      if (this.ready) {
        return;
      }

      try {
        this.config = await loadConfig();
        this.config.settings.launchAtStartup = await isEnabled().catch(
          () => this.config.settings.launchAtStartup,
        );
      } catch {
        this.config = structuredClone(DEFAULT_CONFIG);
      }

      this.activeActionId = resolveRenderableActionId(
        this.config,
        this.config.settings.lastActionId || this.config.settings.defaultActionId,
      );
      this.config.settings.lastActionId = this.activeActionId;
      this.currentAsset = resolveActionAsset(this.config, this.activeActionId);
      this.todoTimer = getInitialTodoTimerState(this.config.todoTimer);
      this.ready = true;
    },
    async persistConfig() {
      await saveConfig(this.config);
      await emitConfigUpdated(this.config);
    },
    async applyLaunchAtStartup(enabled: boolean) {
      try {
        if (enabled) {
          await enable();
        } else {
          await disable();
        }
        this.config.settings.launchAtStartup = enabled;
        await this.persistConfig();
        return { ok: true as const };
      } catch (error) {
        return {
          ok: false as const,
          message: error instanceof Error ? error.message : "开机启动设置失败",
        };
      }
    },
    async setDefaultAction(actionId: string) {
      this.config.settings.defaultActionId = actionId;
      if (!this.activeActionId || this.activeActionId === this.config.settings.lastActionId) {
        this.activeActionId = actionId;
      }
      this.activeActionId = resolveRenderableActionId(this.config, this.activeActionId);
      this.config.settings.lastActionId = this.activeActionId;
      this.currentAsset = resolveActionAsset(this.config, this.activeActionId);
      await this.persistConfig();
    },
    async setScale(scale: number) {
      this.config.settings.scale = scale;
      await this.persistConfig();
    },
    async addAction(name: string) {
      const normalized = name.trim();
      if (!normalized) {
        return { ok: false as const, message: "动作名不能为空" };
      }

      const id = normalized
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `action-${Date.now()}`;

      if (this.config.actions.some((action) => action.id === id)) {
        return { ok: false as const, message: "动作已存在，请换一个名字" };
      }

      this.config.actions.push({
        id,
        name: normalized,
        assetIds: [],
        quickAccess: true,
      });
      await this.persistConfig();
      return { ok: true as const, id };
    },
    async setActionAssets(actionId: string, assetIds: string[]) {
      const action = this.config.actions.find((item) => item.id === actionId);
      if (!action) {
        return;
      }
      action.assetIds = [...assetIds];
      this.activeActionId = resolveRenderableActionId(this.config, this.activeActionId);
      this.config.settings.lastActionId = this.activeActionId;
      this.currentAsset = resolveActionAsset(this.config, this.activeActionId);
      await this.persistConfig();
    },
    async setActiveAction(actionId: string) {
      const nextActionId = resolveRenderableActionId(this.config, actionId);
      this.activeActionId = nextActionId;
      this.config.settings.lastActionId = nextActionId;
      this.currentAsset = resolveActionAsset(this.config, nextActionId);
      await this.persistConfig();
    },
    async setPetPosition(x: number, y: number) {
      this.config.settings.petPosition = { x, y };
      await saveConfig(this.config);
    },
    async syncConfig(config: AppConfig) {
      this.config = config;
      this.activeActionId = resolveRenderableActionId(
        this.config,
        this.activeActionId || this.config.settings.lastActionId || this.config.settings.defaultActionId,
      );
      this.config.settings.lastActionId = this.activeActionId;
      this.currentAsset = resolveActionAsset(this.config, this.activeActionId);
      if (!this.todoTimer.isRunning) {
        this.todoTimer = getInitialTodoTimerState(this.config.todoTimer);
      }
    },
    async importUserAssets(paths: string[]): Promise<ImportAssetsResult> {
      this.importing = true;
      try {
        const filtered = paths.filter((path) =>
          [".gif", ".apng", ".webm"].some((ext) => path.toLowerCase().endsWith(ext)),
        );
        const result = await importAssets(filtered);
        this.config.assets.push(...result.imported);
        await this.persistConfig();
        return result;
      } finally {
        this.importing = false;
      }
    },
    async saveTodoTimerSettings(title: string, minutes: number) {
      this.config.todoTimer.title = title.trim() || DEFAULT_CONFIG.todoTimer.title;
      this.config.todoTimer.minutes = Math.max(1, minutes);
      this.todoTimer = getInitialTodoTimerState(this.config.todoTimer);
      await this.persistConfig();
    },
    async startTodoTimer() {
      if (this.todoTimer.isRunning) {
        return;
      }
      this.todoTimer.isRunning = true;
      this.todoTimer.completed = false;
      await this.setActiveAction(getTodoRunningAction(this.config));
      this.startTicking();
    },
    pauseTodoTimer() {
      this.todoTimer.isRunning = false;
      this.stopTicking();
    },
    async finishTodoTimer() {
      this.stopTicking();
      this.todoTimer.isRunning = false;
      this.todoTimer.completed = true;
      this.todoTimer.remainingSeconds = 0;
      const actionId = resolveRenderableActionId(this.config, getTodoCompletedAction(this.config));
      this.activeActionId = actionId;
      this.config.settings.lastActionId = actionId;
      this.currentAsset = resolveActionAsset(this.config, actionId);
      await emitTodoTimerChanged({
        actionId,
        remainingSeconds: this.todoTimer.remainingSeconds,
        completed: true,
      });
    },
    async resetTodoTimer() {
      this.stopTicking();
      this.todoTimer = getInitialTodoTimerState(this.config.todoTimer);
      this.activeActionId = resolveRenderableActionId(
        this.config,
        this.config.settings.defaultActionId,
      );
      this.config.settings.lastActionId = this.activeActionId;
      this.currentAsset = resolveActionAsset(this.config, this.activeActionId);
      await emitTodoTimerChanged({
        actionId: this.activeActionId,
        remainingSeconds: this.todoTimer.remainingSeconds,
        completed: false,
      });
    },
    startTicking() {
      this.stopTicking();
      timer = window.setInterval(async () => {
        if (!this.todoTimer.isRunning) {
          return;
        }

        if (this.todoTimer.remainingSeconds > 0) {
          this.todoTimer.remainingSeconds -= 1;
          return;
        }

        await this.finishTodoTimer();
      }, 1000);
    },
    stopTicking() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
    async checkForUpdates() {
      try {
        const update = await check();
        if (!update) {
          this.updateInfo = null;
          return { ok: true as const, update: null };
        }

        this.updateInfo = {
          currentVersion: update.currentVersion,
          version: update.version,
          body: update.body,
          date: update.date,
        };
        return { ok: true as const, update };
      } catch (error) {
        this.updateInfo = null;
        return {
          ok: false as const,
          message: error instanceof Error ? error.message : "检查更新失败",
        };
      }
    },
    async installAvailableUpdate() {
      const result = await this.checkForUpdates();
      if (!result.ok) {
        return result;
      }

      if (!result.update) {
        return { ok: true as const, installed: false };
      }

      await result.update.downloadAndInstall();
      await relaunch();
      return { ok: true as const, installed: true };
    },
    async movePetWindowToSavedPosition() {
      const currentWindow = getCurrentWindow();
      if (currentWindow.label !== WINDOW_LABELS.pet) {
        return;
      }

      await currentWindow.setPosition(
        new PhysicalPosition(
          this.config.settings.petPosition.x,
          this.config.settings.petPosition.y,
        ),
      );
    },
  },
});
