import Phaser from "phaser";
import type { CatalogManifest } from "./officialCatalog.ts";

export type PixelQuestManifest = CatalogManifest;

export function queueAssets(
  scene: Phaser.Scene,
  manifest: PixelQuestManifest,
  baseURL: string,
  requestedIDs?: ReadonlySet<string>,
): void {
  const prefix = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
  if (!scene.registry.get("pqNearest")) {
    scene.registry.set("pqNearest", true);
    scene.load.on("filecomplete", (key: string) => {
      if (!scene.textures.exists(key)) return;
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    });
  }
  for (const asset of manifest.assets) {
    if (asset.production_status !== "ready") continue;
    if (requestedIDs && !requestedIDs.has(asset.id)) continue;
    if (scene.textures.exists(asset.id)) continue;
    if (asset.type === "spritesheet") {
      if (!asset.frame_width || !asset.frame_height) continue;
      scene.load.spritesheet(asset.id, prefix + asset.path, {
        frameWidth: asset.frame_width,
        frameHeight: asset.frame_height,
        startFrame: 0,
        endFrame: asset.frames - 1,
        margin: 0,
        spacing: 0,
      });
    } else {
      scene.load.image(asset.id, prefix + asset.path);
    }
  }
}

export function registerAnimations(scene: Phaser.Scene, manifest: PixelQuestManifest): void {
  for (const asset of manifest.assets) {
    if (asset.type !== "spritesheet" || asset.production_status !== "ready") continue;
    if (!scene.textures.exists(asset.id) || scene.anims.exists(asset.id)) continue;
    scene.anims.create({
      key: asset.id,
      frames: scene.anims.generateFrameNumbers(asset.id, { start: 0, end: asset.frames - 1 }),
      frameRate: asset.fps ?? 10,
      repeat: asset.loop ? -1 : 0,
    });
  }
}

export function loadedIds(scene: Phaser.Scene, manifest: PixelQuestManifest | undefined): Set<string> {
  const ids = new Set<string>();
  if (!manifest) return ids;
  for (const asset of manifest.assets) {
    if (asset.production_status === "ready" && scene.textures.exists(asset.id)) ids.add(asset.id);
  }
  return ids;
}

export function releaseTextures(scene: Phaser.Scene, ids: readonly string[]): void {
  for (const id of ids) {
    if (scene.anims.exists(id)) scene.anims.remove(id);
    if (scene.textures.exists(id)) scene.textures.remove(id);
  }
}
