/** Seleção de assets oficiais da Pixel Quest Asset Factory. Sem Phaser. */

import { getStage } from "../logic/stages.ts";
import type { Biome, EnemyKind } from "../logic/types.ts";

export const ASSET_BASE = "/assets/pixel_quest/";
export const PARALLAX_SCALE = 1.05;
export const CHARACTER_ORIGIN = { x: 0.5, y: 0.9375 };
export const CARD_FRAME = { w: 68, h: 84 };

export interface CatalogAsset {
  id: string;
  path: string;
  type: "image" | "spritesheet";
  width: number;
  height: number;
  frames: number;
  frame_width?: number;
  frame_height?: number;
  fps: number | null;
  loop: boolean;
  production_status: string;
  origin?: { x: number; y: number };
}

export interface CatalogManifest {
  schema_version?: string;
  assets: CatalogAsset[];
}

export type HeroPose = "idle" | "walk" | "atk" | "mag" | "hurt" | "win" | "lose";
export type EnemyPose = "idle" | "atk" | "hurt" | "down";

export const KIND_ID: Record<EnemyKind, string> = {
  slimeGreen: "slime_green",
  slimeBlue: "slime_blue",
  mushroom: "mushroom",
  bat: "forest_bat",
  spirit: "forest_spirit",
  crystal: "crystal_creature",
  crystalBat: "crystal_bat",
  ghost: "ghost",
  sentinel: "crystal_sentinel",
  guardian: "stone_guardian",
  dragon: "shadow_dragon",
};

/** Recursos que a fábrica deixou fora de dist/. Nunca entram no preload. */
export const NOT_APPROVED = [
  "samuca.expression.happy",
  "samuca.expression.determined",
  "samuca.expression.surprised",
  "samuca.expression.hurt",
  "samuca.expression.victory",
  "slime_blue.attack",
  "forest_spirit.attack",
  "crystal_creature.attack",
  "crystal_bat.attack",
  "ghost.attack",
  "crystal_sentinel.attack",
  "slime_green.attack",
  "shadow_dragon.phase2_attack",
  "world.stage_map.path",
  ...["enchanted_forest", "forest_ruins", "crystal_cave", "crystal_sanctuary"].flatMap((biome) =>
    [0, 1, 2, 3, 4, 5].map((index) => `${biome}.prop_${String(index).padStart(2, "0")}`),
  ),
];

export const MAP_NODES: ReadonlyArray<{ stage: number; x: number; y: number; boss: boolean }> = [
  { stage: 1, x: 145, y: 568, boss: false },
  { stage: 2, x: 440, y: 588, boss: false },
  { stage: 3, x: 100, y: 340, boss: false },
  { stage: 4, x: 255, y: 145, boss: false },
  { stage: 5, x: 475, y: 280, boss: true },
  { stage: 6, x: 815, y: 600, boss: false },
  { stage: 7, x: 1080, y: 520, boss: false },
  { stage: 8, x: 1065, y: 330, boss: false },
  { stage: 9, x: 790, y: 200, boss: false },
  { stage: 10, x: 1150, y: 165, boss: true },
];

const WORLD_SHARED = new Set([
  "world.main_menu.background",
  "world.stage_map.background",
  "world.victory.background",
  "world.defeat.background",
  "world.ending",
]);

const CELEBRATION = ["star_earned", "victory", "crystal_recovered"];

export function readyIds(manifest: CatalogManifest): Set<string> {
  return new Set(manifest.assets.filter((asset) => asset.production_status === "ready").map((asset) => asset.id));
}

export function pickAnim(candidates: readonly string[], ready: ReadonlySet<string>): string | null {
  for (const id of candidates) if (ready.has(id)) return id;
  return null;
}

export function heroAnimCandidates(pose: HeroPose): string[] {
  if (pose === "idle") return ["samuca.idle"];
  if (pose === "walk") return ["samuca.advance", "samuca.idle"];
  if (pose === "atk" || pose === "mag") return ["samuca.attack", "samuca.prepare"];
  if (pose === "hurt") return ["samuca.hurt", "samuca.idle"];
  if (pose === "win") return ["samuca.victory", "samuca.idle"];
  return ["samuca.defeat", "samuca.hurt"];
}

export function enemyAnimCandidates(kind: EnemyKind, pose: EnemyPose, phase2: boolean): string[] {
  const id = KIND_ID[kind];
  if (kind === "dragon" && phase2) {
    if (pose === "idle") return ["shadow_dragon.phase2_idle", "shadow_dragon.idle"];
    if (pose === "atk") return ["shadow_dragon.magic_attack", "shadow_dragon.prepare", "shadow_dragon.phase2_idle"];
    if (pose === "hurt") return ["shadow_dragon.hurt", "shadow_dragon.phase2_idle"];
    return ["shadow_dragon.defeat", "shadow_dragon.hurt"];
  }
  if (pose === "idle") return [`${id}.idle`];
  if (pose === "hurt") return [`${id}.hurt`, `${id}.idle`];
  if (pose === "down") return [`${id}.defeat`, `${id}.hurt`];
  if (kind === "guardian") return ["stone_guardian.ground_impact", "stone_guardian.prepare", "stone_guardian.idle"];
  if (kind === "dragon") return ["shadow_dragon.magic_attack", "shadow_dragon.prepare", "shadow_dragon.idle"];
  return [`${id}.attack`, `${id}.idle`];
}

export function pendingAttackId(kind: EnemyKind, phase2: boolean): string | null {
  if (kind === "dragon" && phase2) return "shadow_dragon.phase2_attack";
  if (kind === "guardian" || kind === "dragon" || kind === "mushroom" || kind === "bat") return null;
  return `${KIND_ID[kind]}.attack`;
}

export function biomeAssetId(biome: Biome): string {
  if (biome === "forest") return "enchanted_forest";
  if (biome === "ruins") return "forest_ruins";
  if (biome === "cave") return "crystal_cave";
  return "crystal_sanctuary";
}

export function layerIds(biome: Biome): string[] {
  const id = biomeAssetId(biome);
  return ["distant", "midground", "scenery", "ground", "foreground", "particles"].map((part) => `${id}.${part}`);
}

export function layersJsonPath(biome: Biome): string {
  return `05_environments/${biomeAssetId(biome)}/metadata/layers.json`;
}

export function layerDepth(layerId: string): number {
  if (layerId.endsWith(".distant")) return 0;
  if (layerId.endsWith(".midground")) return 1;
  if (layerId.endsWith(".scenery")) return 2;
  if (layerId.endsWith(".ground")) return 3;
  if (layerId.endsWith(".particles")) return 8;
  if (layerId.endsWith(".foreground")) return 9;
  return 1;
}

/** Centro da camada para a linha `baseline` coincidir com os pés (GROUND_Y). */
export function layerPlacement(baseline: number, groundY = 448, viewW = 1280, viewH = 720, scale = PARALLAX_SCALE): { x: number; y: number; scale: number } {
  return {
    x: viewW / 2,
    y: groundY - (baseline - viewH / 2) * scale,
    scale,
  };
}

export function parallaxBleed(scale = PARALLAX_SCALE, viewW = 1280): number {
  return ((scale - 1) * viewW) / 2;
}

export function parallaxAmplitude(scrollFactor: number): number {
  return Math.min(12, 2 + scrollFactor * 8);
}

export function officialScale(kind: "hero" | EnemyKind): number {
  if (kind === "hero") return 2;
  if (kind === "dragon" || kind === "guardian") return 1.5;
  return 2;
}

export function fitCard(cellW: number, cellH: number): { w: number; h: number } {
  const aspect = CARD_FRAME.w / CARD_FRAME.h;
  let w = cellW;
  let h = w / aspect;
  if (h > cellH) {
    h = cellH;
    w = h * aspect;
  }
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

export function cardFaceId(symbol: string): string {
  return `ui.card_${symbol}`;
}

export function vfxChoice(name: string, reduce: boolean, ready: ReadonlySet<string>): string | null {
  const reduced = `${name}.reduced`;
  const full = `${name}.effect`;
  if (reduce && ready.has(reduced)) return reduced;
  if (ready.has(full)) return full;
  if (ready.has(reduced)) return reduced;
  return null;
}

export function sharedAssetIds(manifest: CatalogManifest): string[] {
  const ids: string[] = [];
  for (const asset of manifest.assets) {
    if (asset.production_status !== "ready") continue;
    const shared =
      asset.id.startsWith("ui.") ||
      asset.id.startsWith("samuca.") ||
      asset.id === "brand.logo" ||
      WORLD_SHARED.has(asset.id) ||
      CELEBRATION.some((name) => asset.id === `${name}.effect` || asset.id === `${name}.reduced`);
    if (shared) ids.push(asset.id);
  }
  return ids;
}

const STAGE_VFX = ["sword_slash", "strong_attack", "weak_attack", "magic_impact", "hero_damage", "enemy_defeat"];

export function stageAssetIds(manifest: CatalogManifest, stageId: number): string[] {
  const ready = readyIds(manifest);
  const stage = getStage(stageId);
  const ids = new Set<string>();
  for (const id of layerIds(stage.biome)) if (ready.has(id)) ids.add(id);
  const poses: EnemyPose[] = ["idle", "atk", "hurt", "down"];
  for (const enemy of stage.enemies) {
    for (const pose of poses) {
      for (const candidate of enemyAnimCandidates(enemy.kind, pose, false)) if (ready.has(candidate)) ids.add(candidate);
      if (enemy.kind === "dragon") {
        for (const candidate of enemyAnimCandidates(enemy.kind, pose, true)) if (ready.has(candidate)) ids.add(candidate);
      }
    }
  }
  if (stage.enemies.some((enemy) => enemy.kind === "guardian")) {
    for (const extra of ["stone_guardian.entrance", "stone_guardian.prepare", "stone_guardian.posture_transition"]) {
      if (ready.has(extra)) ids.add(extra);
    }
  }
  if (stage.enemies.some((enemy) => enemy.kind === "dragon")) {
    for (const extra of ["shadow_dragon.prepare", "shadow_dragon.phase_transition"]) {
      if (ready.has(extra)) ids.add(extra);
    }
  }
  const names = [...STAGE_VFX];
  if (stage.enemies.some((enemy) => enemy.kind === "guardian")) names.push("golem_attack");
  if (stage.enemies.some((enemy) => enemy.kind === "dragon")) names.push("dragon_attack", "dragon_special");
  for (const name of names) {
    if (ready.has(`${name}.effect`)) ids.add(`${name}.effect`);
    if (ready.has(`${name}.reduced`)) ids.add(`${name}.reduced`);
  }
  return [...ids];
}

export function runtimeRequestedIds(manifest: CatalogManifest): string[] {
  const ids = new Set<string>(sharedAssetIds(manifest));
  for (let stage = 1; stage <= 10; stage++) {
    for (const id of stageAssetIds(manifest, stage)) ids.add(id);
  }
  return [...ids];
}

export interface AttackPlan {
  kind: EnemyKind;
  phase2: boolean;
  pending: string | null;
  played: string | null;
}

export function attackPlans(ready: ReadonlySet<string>): AttackPlan[] {
  const kinds: EnemyKind[] = [
    "slimeGreen",
    "slimeBlue",
    "mushroom",
    "bat",
    "spirit",
    "crystal",
    "crystalBat",
    "ghost",
    "sentinel",
    "guardian",
    "dragon",
  ];
  const plans: AttackPlan[] = [];
  for (const kind of kinds) {
    plans.push({
      kind,
      phase2: false,
      pending: pendingAttackId(kind, false),
      played: pickAnim(enemyAnimCandidates(kind, "atk", false), ready),
    });
    if (kind === "dragon") {
      plans.push({
        kind,
        phase2: true,
        pending: pendingAttackId(kind, true),
        played: pickAnim(enemyAnimCandidates(kind, "atk", true), ready),
      });
    }
  }
  return plans;
}
