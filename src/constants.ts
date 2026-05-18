import type { AppConfig, PetAction, PetAsset } from "./types";

export const WINDOW_LABELS = {
  pet: "pet",
  settings: "settings",
} as const;

export const CONFIG_FILE = "config.json";
export const ASSET_DIR = "assets";

export const DEFAULT_ACTIONS: PetAction[] = [
  { id: "idle", name: "待机", assetIds: ["cat-idle"], quickAccess: true },
  { id: "sit", name: "坐下", assetIds: ["cat-sit"], quickAccess: true },
  { id: "groom", name: "洗香香", assetIds: ["cat-groom"], quickAccess: true },
  { id: "play", name: "逗他玩", assetIds: ["cat-play"], quickAccess: true },
  { id: "supervise", name: "请他监督", assetIds: ["cat-supervise"], quickAccess: true },
];

export const DEFAULT_ASSETS: PetAsset[] = [
  {
    id: "cat-idle",
    name: "默认猫咪待机",
    kind: "gif",
    fileName: "cat-idle.gif",
    localPath: "assets/cat-idle.gif",
    mimeType: "image/gif",
    isBundled: true,
  },
  {
    id: "cat-sit",
    name: "默认猫咪坐下",
    kind: "gif",
    fileName: "cat-sit.png",
    localPath: "assets/cat-sit.png",
    mimeType: "image/png",
    isBundled: true,
  },
  {
    id: "cat-groom",
    name: "默认猫咪洗香香",
    kind: "gif",
    fileName: "cat-groom.png",
    localPath: "assets/cat-groom.png",
    mimeType: "image/png",
    isBundled: true,
  },
  {
    id: "cat-play",
    name: "默认猫咪玩耍",
    kind: "gif",
    fileName: "cat-play.png",
    localPath: "assets/cat-play.png",
    mimeType: "image/png",
    isBundled: true,
  },
  {
    id: "cat-supervise",
    name: "默认猫咪监督",
    kind: "gif",
    fileName: "cat-supervise.png",
    localPath: "assets/cat-supervise.png",
    mimeType: "image/png",
    isBundled: true,
  },
];

export const DEFAULT_CONFIG: AppConfig = {
  assets: DEFAULT_ASSETS,
  actions: DEFAULT_ACTIONS,
  todoTimer: {
    title: "监督我写东西",
    minutes: 25,
    runningActionId: "supervise",
    completedActionId: "idle",
  },
  settings: {
    defaultActionId: "idle",
    scale: 1,
    launchAtStartup: false,
    petPosition: {
      x: 80,
      y: 80,
    },
    lastActionId: "idle",
  },
};

export const SUPPORTED_EXTENSIONS = ["gif", "apng", "webm"];
