export type AssetKind = "gif" | "apng" | "webm";

export interface PetAsset {
  id: string;
  name: string;
  kind: AssetKind;
  fileName: string;
  localPath: string;
  mimeType: string;
  isBundled: boolean;
}

export interface PetAction {
  id: string;
  name: string;
  assetIds: string[];
  quickAccess: boolean;
}

export interface TodoTimerSettings {
  title: string;
  minutes: number;
  runningActionId: string;
  completedActionId: string;
}

export interface PetPosition {
  x: number;
  y: number;
}

export interface AppSettings {
  defaultActionId: string;
  scale: number;
  launchAtStartup: boolean;
  petPosition: PetPosition;
  lastActionId: string;
}

export interface AppConfig {
  assets: PetAsset[];
  actions: PetAction[];
  todoTimer: TodoTimerSettings;
  settings: AppSettings;
}

export interface TodoTimerRuntimeState {
  isRunning: boolean;
  remainingSeconds: number;
  completed: boolean;
}

export interface UpdateInfo {
  currentVersion: string;
  version: string;
  body?: string;
  date?: string;
}

export interface TrayActionPayload {
  action:
    | "toggle-pet"
    | "open-settings"
    | "todo-start"
    | "todo-pause"
    | "todo-reset"
    | "toggle-autostart"
    | "check-update"
    | "quit";
}

export interface TodoTimerChangedPayload {
  actionId: string;
  remainingSeconds: number;
  completed: boolean;
}

export interface ImportAssetsResult {
  imported: PetAsset[];
  skipped: string[];
}
