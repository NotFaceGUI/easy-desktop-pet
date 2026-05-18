import type { AppConfig, PetAction, PetAsset } from "../types";

export function getActionById(config: AppConfig, actionId: string): PetAction | undefined {
  return config.actions.find((action) => action.id === actionId);
}

export function getAssetById(config: AppConfig, assetId: string): PetAsset | undefined {
  return config.assets.find((asset) => asset.id === assetId);
}

export function resolveActionAsset(
  config: AppConfig,
  actionId: string,
): PetAsset | null {
  const fallbackAction = getActionById(config, config.settings.defaultActionId);
  const targetAction =
    getActionById(config, actionId) ?? fallbackAction ?? config.actions[0];

  const availableIds = targetAction?.assetIds.filter((id) => getAssetById(config, id)) ?? [];
  if (!availableIds.length) {
    const fallbackId = fallbackAction?.assetIds.find((id) => getAssetById(config, id));
    return fallbackId ? getAssetById(config, fallbackId) ?? null : null;
  }

  const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
  return getAssetById(config, randomId) ?? null;
}
