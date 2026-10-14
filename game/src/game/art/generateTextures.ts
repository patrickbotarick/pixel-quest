import Phaser from "phaser";
import { diamond, outlinedOval, oval, px } from "./draw.ts";
import { drawCave, drawForest, drawMap, drawRuins, drawSanctuary } from "./backgrounds.ts";
import {
  ENEMY_POSES,
  HERO_POSES,
  drawDragon,
  drawGuardian,
  drawHero,
  drawIcon,
  drawSimpleEnemy,
  type IconName,
  type SimpleKind,
} from "./characters.ts";

const SIMPLE: SimpleKind[] = [
  "slimeGreen",
  "slimeBlue",
  "mushroom",
  "bat",
  "spirit",
  "crystal",
  "crystalBat",
  "ghost",
  "sentinel",
];

const ICONS: IconName[] = ["sword", "shield", "star", "potion", "crystal", "heart"];

function add(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  try {
    draw(ctx);
  } catch (error) {
    console.error(key, error);
    ctx.fillStyle = "#F2C567";
    ctx.fillRect(0, 0, w, h);
  }
  scene.textures.addCanvas(key, canvas);
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

export function generateAllTextures(scene: Phaser.Scene): void {
  for (const pose of HERO_POSES) add(scene, `hero_${pose}`, 64, 64, (ctx) => drawHero(ctx, pose));
  for (const kind of SIMPLE) {
    for (const pose of ENEMY_POSES) {
      add(scene, `${kind}_${pose}`, 48, 48, (ctx) => drawSimpleEnemy(ctx, kind, pose));
    }
  }
  for (const pose of ENEMY_POSES) {
    add(scene, `guardian_${pose}`, 80, 80, (ctx) => drawGuardian(ctx, pose));
    add(scene, `dragon_p1_${pose}`, 112, 80, (ctx) => drawDragon(ctx, pose, false));
    add(scene, `dragon_p2_${pose}`, 112, 80, (ctx) => drawDragon(ctx, pose, true));
  }
  for (const icon of ICONS) add(scene, `icon_${icon}`, 32, 32, (ctx) => drawIcon(ctx, icon));
  add(scene, "bg_forest", 640, 360, (ctx) => drawForest(ctx, 640, 360));
  add(scene, "bg_ruins", 640, 360, (ctx) => drawRuins(ctx, 640, 360));
  add(scene, "bg_cave", 640, 360, (ctx) => drawCave(ctx, 640, 360));
  add(scene, "bg_sanctuary", 640, 360, (ctx) => drawSanctuary(ctx, 640, 360));
  add(scene, "bg_map", 640, 360, (ctx) => drawMap(ctx, 640, 360));
  add(scene, "star", 16, 16, (ctx) => {
    diamond(ctx, 8, 8, 7, "#F2C567");
    diamond(ctx, 8, 8, 3, "#FFF2D6");
  });
  add(scene, "lock", 16, 16, (ctx) => {
    px(ctx, 3, 7, 10, 8, "#182437");
    px(ctx, 4, 8, 8, 6, "#F2C567");
    px(ctx, 5, 3, 6, 5, "#182437");
    px(ctx, 6, 4, 4, 3, "#FFF2D6");
  });
  add(scene, "crystal", 32, 32, (ctx) => drawIcon(ctx, "crystal"));
  add(scene, "marker", 14, 22, (ctx) => {
    px(ctx, 5, 0, 4, 14, "#F4F7FB");
    px(ctx, 3, 12, 8, 4, "#F2C567");
    px(ctx, 6, 16, 2, 5, "#C9863A");
  });
  add(scene, "spark", 8, 8, (ctx) => {
    diamond(ctx, 4, 4, 3, "#FFF2D6");
  });
  add(scene, "cloud", 48, 20, (ctx) => {
    oval(ctx, 16, 12, 12, 7, "#FFF2D6");
    oval(ctx, 28, 10, 14, 8, "#FFF2D6");
  });
  add(scene, "card_back", 32, 40, (ctx) => {
    px(ctx, 0, 0, 32, 40, "#24344C");
    px(ctx, 2, 2, 28, 36, "#315C8A");
    diamond(ctx, 16, 20, 8, "#F2C567");
    diamond(ctx, 16, 20, 4, "#5B9BE6");
  });
}

export function heroFrames(pose: "idle" | "walk" | "atk" | "mag" | "hurt" | "win" | "lose"): string[] {
  if (pose === "idle") return ["hero_idle0", "hero_idle1"];
  if (pose === "walk") return ["hero_walk0", "hero_walk1"];
  if (pose === "atk") return ["hero_atk0", "hero_atk1", "hero_atk2"];
  if (pose === "mag") return ["hero_mag0", "hero_mag1", "hero_mag1"];
  if (pose === "hurt") return ["hero_hurt"];
  if (pose === "win") return ["hero_win0", "hero_win1"];
  return ["hero_lose"];
}

export function enemyFrames(kind: string, pose: "idle" | "atk" | "hurt" | "down", phase2 = false): string[] {
  const prefix = kind === "dragon" ? (phase2 ? "dragon_p2" : "dragon_p1") : kind;
  if (pose === "idle") return [`${prefix}_idle0`, `${prefix}_idle1`];
  if (pose === "atk") return [`${prefix}_atk0`, `${prefix}_atk1`];
  if (pose === "hurt") return [`${prefix}_hurt`];
  return [`${prefix}_down`];
}
