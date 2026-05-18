import { BaseDirectory, readFile } from "@tauri-apps/plugin-fs";
import type { PetAsset } from "../types";

const objectUrlCache = new Map<string, string>();

export async function resolveAssetUrl(asset: PetAsset): Promise<string> {
  if (asset.isBundled) {
    return `/assets/${asset.fileName}`;
  }

  const cachedUrl = objectUrlCache.get(asset.id);
  if (cachedUrl) {
    return cachedUrl;
  }

  const data = await readFile(asset.localPath, {
    baseDir: BaseDirectory.AppData,
  });
  const blob = new Blob([data], { type: asset.mimeType });
  const objectUrl = URL.createObjectURL(blob);
  objectUrlCache.set(asset.id, objectUrl);
  return objectUrl;
}

export function revokeAssetUrl(assetId: string): void {
  const url = objectUrlCache.get(assetId);
  if (!url) {
    return;
  }

  URL.revokeObjectURL(url);
  objectUrlCache.delete(assetId);
}

export function isVideoAsset(asset: PetAsset | null | undefined): boolean {
  return asset?.kind === "webm";
}
