import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import type { EnemyKind } from "../logic/types.ts";
import { enemyFrames, heroFrames } from "./generateTextures.ts";
import {
  enemyAnimCandidates,
  heroAnimCandidates,
  pickAnim,
  vfxChoice,
  type EnemyPose,
  type HeroPose,
} from "./officialCatalog.ts";
import { loadedIds, type PixelQuestManifest } from "./phaserAssets.ts";

function ready(scene: Phaser.Scene): Set<string> {
  return loadedIds(scene, scene.registry.get("pqManifest") as PixelQuestManifest | undefined);
}

export function playHeroPose(
  scene: Phaser.Scene,
  anim: AnimationController,
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  pose: HeroPose,
  fps: number,
  loop: boolean,
): void {
  const id = pickAnim(heroAnimCandidates(pose), ready(scene));
  if (id && scene.anims.exists(id)) anim.play(sprite, [id], fps, loop);
  else anim.play(sprite, heroFrames(pose), fps, loop);
}

export function playEnemyPose(
  scene: Phaser.Scene,
  anim: AnimationController,
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  kind: EnemyKind,
  pose: EnemyPose,
  phase2: boolean,
  fps: number,
  loop: boolean,
): void {
  const id = pickAnim(enemyAnimCandidates(kind, pose, phase2), ready(scene));
  if (id && scene.anims.exists(id)) anim.play(sprite, [id], fps, loop);
  else anim.play(sprite, enemyFrames(kind, pose, phase2), fps, loop);
}

export function playImpact(scene: Phaser.Scene, name: string, x: number, y: number, scale: number, reduce: boolean): void {
  const id = vfxChoice(name, reduce, ready(scene));
  if (!id || !scene.anims.exists(id)) return;
  const fx = scene.add.sprite(x, y, id, 0).setOrigin(0.5, 0.5).setDepth(16).setScale(scale);
  fx.play(id);
  fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
}
