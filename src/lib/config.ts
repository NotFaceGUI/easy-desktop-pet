import { BaseDirectory } from "@tauri-apps/api/path";
import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { CONFIG_FILE, ASSET_DIR, DEFAULT_CONFIG } from "../constants";
import type { AppConfig, ImportAssetsResult, PetAction, PetAsset } from "../types";

function mergeAssets(assets: PetAsset[] | undefined): PetAsset[] {
  const merged = new Map(DEFAULT_CONFIG.assets.map((asset) => [asset.id, asset]));

  for (const asset of assets ?? []) {
    merged.set(asset.id, asset);
  }

  return Array.from(merged.values());
}

function mergeActions(actions: PetAction[] | undefined): PetAction[] {
  const incoming = new Map((actions ?? []).map((action) => [action.id, action]));

  return DEFAULT_CONFIG.actions.map((defaultAction) => {
    const existing = incoming.get(defaultAction.id);
    if (!existing) {
      return defaultAction;
    }

    return {
      ...defaultAction,
      ...existing,
      assetIds: existing.assetIds?.length ? existing.assetIds : defaultAction.assetIds,
    };
  });
}

function mergeConfig(partial: Partial<AppConfig> | null | undefined): AppConfig {
  const partialSettings = partial?.settings;

  return {
    assets: mergeAssets(partial?.assets),
    actions: mergeActions(partial?.actions),
    todoTimer: {
      ...DEFAULT_CONFIG.todoTimer,
      ...partial?.todoTimer,
    },
    settings: {
      ...DEFAULT_CONFIG.settings,
      ...(partialSettings
        ? {
            defaultActionId: partialSettings.defaultActionId,
            scale: partialSettings.scale,
            launchAtStartup: partialSettings.launchAtStartup,
            lastActionId: partialSettings.lastActionId,
          }
        : {}),
      petPosition: {
        ...DEFAULT_CONFIG.settings.petPosition,
        ...partialSettings?.petPosition,
      },
    },
  };
}

async function removeMissingAssets(config: AppConfig): Promise<AppConfig> {
  const assets = (
    await Promise.all(
      config.assets.map(async (asset) => {
        if (asset.isBundled) {
          return asset;
        }

        const hasFile = await exists(asset.localPath, {
          baseDir: BaseDirectory.AppData,
        }).catch(() => false);

        return hasFile ? asset : null;
      }),
    )
  ).filter((asset): asset is PetAsset => Boolean(asset));

  const assetIds = new Set(assets.map((asset) => asset.id));

  return {
    ...config,
    assets,
    actions: config.actions.map((action) => ({
      ...action,
      assetIds: action.assetIds.filter((assetId) => assetIds.has(assetId)),
    })),
  };
}

export async function ensureConfigReady(): Promise<void> {
  await mkdir(ASSET_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
}

export async function loadConfig(): Promise<AppConfig> {
  await ensureConfigReady();
  const hasConfig = await exists(CONFIG_FILE, { baseDir: BaseDirectory.AppConfig });
  if (!hasConfig) {
    await saveConfig(DEFAULT_CONFIG);
    return structuredClone(DEFAULT_CONFIG);
  }

  try {
    const raw = await readTextFile(CONFIG_FILE, { baseDir: BaseDirectory.AppConfig });
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    const merged = mergeConfig(parsed);
    const normalized = await removeMissingAssets(merged);
    await saveConfig(normalized);
    return normalized;
  } catch {
    await saveConfig(DEFAULT_CONFIG);
    return structuredClone(DEFAULT_CONFIG);
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await ensureConfigReady();
  await writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    baseDir: BaseDirectory.AppConfig,
  });
}

export async function importAssets(paths: string[]): Promise<ImportAssetsResult> {
  const result = await invoke<ImportAssetsResult>("import_assets", { paths });
  return result;
}
