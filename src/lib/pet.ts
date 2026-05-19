import type { AppConfig, PetAction, PetAsset } from "../types";

export function getActionById(config: AppConfig, actionId: string): PetAction | undefined {
  return config.actions.find((action) => action.id === actionId);
}

export function getAssetById(config: AppConfig, assetId: string): PetAsset | undefined {
  return config.assets.find((asset) => asset.id === assetId);
}

export function getActionAssetIds(config: AppConfig, actionId: string): string[] {
  return getActionById(config, actionId)?.assetIds.filter((id) => getAssetById(config, id)) ?? [];
}

export function hasActionAssets(config: AppConfig, actionId: string): boolean {
  return getActionAssetIds(config, actionId).length > 0;
}

export function resolveRenderableActionId(config: AppConfig, actionId: string): string {
  const candidates = [actionId, config.settings.defaultActionId, ...config.actions.map((action) => action.id)];

  return candidates.find((candidateId) => Boolean(candidateId) && hasActionAssets(config, candidateId)) ?? actionId;
}

export function resolveActionAsset(
  config: AppConfig,
  actionId: string,
): PetAsset | null {
  const renderableActionId = resolveRenderableActionId(config, actionId);
  const availableIds = getActionAssetIds(config, renderableActionId);
  if (!availableIds.length) {
    return null;
  }

  const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
  return getAssetById(config, randomId) ?? null;
}
