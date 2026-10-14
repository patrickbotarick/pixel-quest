import { blush, diamond, eyes, outlinedOval, oval, px, smile, type Mood } from "./draw.ts";

export type HeroPose =
  | "idle0"
  | "idle1"
  | "walk0"
  | "walk1"
  | "atk0"
  | "atk1"
  | "atk2"
  | "mag0"
  | "mag1"
  | "hurt"
  | "win0"
  | "win1"
  | "lose";

export const HERO_POSES: HeroPose[] = [
  "idle0",
  "idle1",
  "walk0",
  "walk1",
  "atk0",
  "atk1",
  "atk2",
  "mag0",
  "mag1",
  "hurt",
  "win0",
  "win1",
  "lose",
];

export type EnemyPose = "idle0" | "idle1" | "atk0" | "atk1" | "hurt" | "down";
export const ENEMY_POSES: EnemyPose[] = ["idle0", "idle1", "atk0", "atk1", "hurt", "down"];

type Sword = "idle" | "back" | "slash" | "low" | "up" | "ground";

function blade(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  const steps = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    px(ctx, x, y, 2, 2, "#F4F7FB");
    px(ctx, x, y + 2, 2, 1, "#B7C3D4");
  }
  px(ctx, x0 - 2, y0 - 1, 5, 3, "#C9863A");
  px(ctx, x0 - 1, y0, 3, 2, "#F2C567");
}

export function drawHero(ctx: CanvasRenderingContext2D, pose: HeroPose): void {
  const bob = pose === "idle1" || pose === "win1" ? -2 : pose === "lose" ? 8 : 0;
  const lean = pose === "hurt" ? -4 : pose === "atk1" || pose === "atk2" ? 4 : pose === "walk1" ? 2 : 0;
  const ox = 26 + lean;
  const oy = 30 + bob;
  const mood: Mood = pose === "hurt" || pose === "lose" ? "shut" : pose === "win0" || pose === "win1" || pose === "mag1" ? "wow" : "happy";
  oval(ctx, ox + 2, 58, 14, 4, "rgba(24,36,55,0.28)");
  if (pose !== "lose") {
    outlinedOval(ctx, ox - 7, oy + 8, 6, 9, "#315C48");
    px(ctx, ox - 10, oy + 6, 5, 12, "#2A5340");
    px(ctx, ox + 6, oy + (pose === "walk0" ? 8 : 6), 5, 12, "#315C48");
    px(ctx, ox - 11, oy + 16, 7, 4, "#4A3428");
    px(ctx, ox + 5, oy + (pose === "walk1" ? 18 : 16), 7, 4, "#6B4A32");
  } else {
    px(ctx, ox - 12, oy + 14, 22, 5, "#315C48");
    px(ctx, ox - 14, oy + 18, 8, 4, "#4A3428");
    px(ctx, ox + 8, oy + 18, 8, 4, "#6B4A32");
  }
  outlinedOval(ctx, ox + 1, oy + 2, 11, 12, "#3E86C8");
  px(ctx, ox - 8, oy + 1, 18, 3, "#F2C567");
  px(ctx, ox - 1, oy - 2, 3, 6, "#F2C567");
  outlinedOval(ctx, ox + 1, oy - 14, 11, 10, "#F6C7A2");
  oval(ctx, ox + 1, oy - 20, 12, 7, "#6B3A22");
  px(ctx, ox - 10, oy - 18, 5, 8, "#6B3A22");
  px(ctx, ox + 8, oy - 22, 5, 7, "#A86B3C");
  px(ctx, ox + 4, oy - 24, 4, 4, "#F2C567");
  eyes(ctx, ox + 1, oy - 14, mood);
  if (mood !== "shut") blush(ctx, ox + 1, oy - 8);
  smile(ctx, ox + 1, oy - 8, pose.startsWith("win") || pose.startsWith("mag"));
  const sword: Sword =
    pose === "atk0"
      ? "back"
      : pose === "atk1"
        ? "slash"
        : pose === "atk2"
          ? "low"
          : pose === "mag0" || pose === "mag1" || pose.startsWith("win")
            ? "up"
            : pose === "lose"
              ? "ground"
              : "idle";
  if (sword === "idle") blade(ctx, ox + 12, oy + 2, ox + 18, oy - 14);
  if (sword === "back") blade(ctx, ox + 4, oy + 2, ox - 12, oy - 8);
  if (sword === "slash") blade(ctx, ox + 10, oy + 2, ox + 30, oy - 2);
  if (sword === "low") blade(ctx, ox + 10, oy + 4, ox + 28, oy + 10);
  if (sword === "up") blade(ctx, ox + 18, oy + 6, ox + 26, oy - 20);
  if (sword === "ground") blade(ctx, ox + 16, oy + 18, ox + 30, oy + 18);
  if (pose === "mag0" || pose === "mag1") {
    px(ctx, ox + 16, oy - 26, 3, 3, "#F2C567");
    px(ctx, ox + 4, oy - 30, 2, 2, "#7EB6FF");
    px(ctx, ox + 20, oy - 18, 2, 2, "#C9B4FF");
    px(ctx, ox - 2, oy - 28, 2, 2, "#FFF2D6");
  }
  if (pose === "atk1") {
    px(ctx, ox + 20, oy - 8, 10, 2, "#FFF2D6");
    px(ctx, ox + 24, oy - 4, 8, 2, "#D5E4FF");
  }
}

export type SimpleKind =
  | "slimeGreen"
  | "slimeBlue"
  | "mushroom"
  | "bat"
  | "spirit"
  | "crystal"
  | "crystalBat"
  | "ghost"
  | "sentinel";

function shadow(ctx: CanvasRenderingContext2D, x: number, y = 44): void {
  oval(ctx, x, y, 12, 3, "rgba(24,36,55,0.25)");
}

function drawSlime(ctx: CanvasRenderingContext2D, pose: EnemyPose, blue: boolean): void {
  const squish = pose === "idle1" || pose === "atk1";
  const down = pose === "down";
  const rx = down ? 16 : squish ? 16 : 13;
  const ry = down ? 6 : squish ? 10 : 13;
  const cy = down ? 38 : squish ? 32 : 28;
  shadow(ctx, 24, 44);
  const fill = blue ? "#4C8FE0" : "#5CBF6A";
  const belly = blue ? "#B9D6FF" : "#D7F7C2";
  const shade = blue ? "#2C5E9C" : "#2E8B4A";
  outlinedOval(ctx, 24, cy, rx, ry, fill);
  oval(ctx, 24, cy + 3, rx * 0.62, ry * 0.45, belly);
  px(ctx, 16, cy - 2, 6, 4, shade);
  if (!down && pose !== "hurt") {
    px(ctx, 18, cy - ry - 2, 3, 4, fill);
    px(ctx, 27, cy - ry - 3, 3, 5, fill);
  }
  eyes(ctx, 24, cy - 2, pose === "hurt" || down ? "shut" : pose === "atk0" ? "focus" : "happy", 5);
  if (pose !== "hurt" && !down) smile(ctx, 24, cy + 4);
  if (blue) px(ctx, 30, cy - 8, 4, 6, "#E7F3FF");
}

function drawMushroom(ctx: CanvasRenderingContext2D, pose: EnemyPose): void {
  const hop = pose === "idle1" || pose === "atk1" ? -3 : pose === "down" ? 6 : 0;
  shadow(ctx, 24);
  outlinedOval(ctx, 24, 30 + hop, 7, 10, "#F3D2A6");
  outlinedOval(ctx, 24, 18 + hop, 16, 10, pose === "down" ? "#C96B6B" : "#E25B4A");
  oval(ctx, 16, 16 + hop, 3, 2, "#FFF2D6");
  oval(ctx, 24, 14 + hop, 3, 2, "#FFF2D6");
  oval(ctx, 32, 17 + hop, 3, 2, "#FFF2D6");
  px(ctx, 12, 24 + hop, 4, 3, "#F3D2A6");
  px(ctx, 32, 24 + hop, 4, 3, "#F3D2A6");
  eyes(ctx, 24, 28 + hop, pose === "hurt" || pose === "down" ? "shut" : "focus", 4);
  smile(ctx, 24, 33 + hop);
}

function wing(ctx: CanvasRenderingContext2D, x: number, y: number, up: boolean, color: string): void {
  outlinedOval(ctx, x, y + (up ? -4 : 2), 10, up ? 6 : 4, color);
}

function drawBat(ctx: CanvasRenderingContext2D, pose: EnemyPose, crystal: boolean): void {
  const body = crystal ? "#8E79D8" : "#6E5B8A";
  const wingColor = crystal ? "#C8B8FF" : "#8D79A8";
  const y = pose === "idle1" ? 22 : pose === "down" ? 34 : 24;
  const up = pose === "idle0" || pose === "atk0";
  shadow(ctx, 24);
  if (pose !== "down") {
    wing(ctx, 10, y, up, wingColor);
    wing(ctx, 38, y, up, wingColor);
  }
  outlinedOval(ctx, 24, y + 2, 8, 7, body);
  px(ctx, 18, y - 6, 3, 5, "#F2C7D8");
  px(ctx, 27, y - 6, 3, 5, "#F2C7D8");
  eyes(ctx, 24, y + 1, pose === "hurt" || pose === "down" ? "shut" : "wow", 4);
  if (crystal) {
    px(ctx, 22, y - 2, 3, 3, "#F2C567");
    px(ctx, 30, y + 4, 3, 3, "#B9F1FF");
  }
}

function drawSpirit(ctx: CanvasRenderingContext2D, pose: EnemyPose): void {
  const y = pose === "idle1" ? 20 : pose === "down" ? 32 : 23;
  shadow(ctx, 24);
  outlinedOval(ctx, 24, y + 4, 12, pose === "down" ? 7 : 14, "#7ED0C8");
  oval(ctx, 24, y + 8, 7, 6, "#E7FFFB");
  px(ctx, 16, y - 8, 5, 4, "#3E8F55");
  px(ctx, 22, y - 11, 6, 4, "#67C58D");
  px(ctx, 28, y - 8, 5, 4, "#3E8F55");
  eyes(ctx, 24, y + 2, pose === "hurt" || pose === "down" ? "shut" : "happy", 4);
  smile(ctx, 24, y + 8);
}

function drawCrystal(ctx: CanvasRenderingContext2D, pose: EnemyPose): void {
  const y = pose === "idle1" ? 24 : pose === "down" ? 34 : 26;
  const r = pose === "down" ? 8 : pose === "atk1" ? 15 : 13;
  shadow(ctx, 24);
  diamond(ctx, 24, y, r + 2, "#182437");
  diamond(ctx, 24, y, r, pose === "hurt" ? "#C7B6EE" : "#9B7BE0");
  diamond(ctx, 24, y + 2, r * 0.45, "#E6DBFF");
  px(ctx, 22, y - r + 2, 3, 6, "#FFF2D6");
  eyes(ctx, 24, y, pose === "hurt" || pose === "down" ? "shut" : "wow", 4);
}

function drawGhost(ctx: CanvasRenderingContext2D, pose: EnemyPose): void {
  const y = pose === "idle1" ? 20 : pose === "down" ? 30 : 22;
  shadow(ctx, 24);
  outlinedOval(ctx, 24, y + 2, 13, 14, "#F7F4FF");
  const wave = pose === "idle1" ? 1 : 0;
  px(ctx, 12, y + 12, 5, 4 + wave, "#F7F4FF");
  px(ctx, 18, y + 14, 5, 3 - wave, "#F7F4FF");
  px(ctx, 25, y + 12, 5, 5 + wave, "#F7F4FF");
  px(ctx, 31, y + 14, 5, 3, "#F7F4FF");
  eyes(ctx, 24, y, pose === "hurt" || pose === "down" ? "shut" : "happy", 5);
  blush(ctx, 24, y + 6);
  smile(ctx, 24, y + 6);
}

function drawSentinel(ctx: CanvasRenderingContext2D, pose: EnemyPose): void {
  const lean = pose === "atk1" ? 3 : pose === "hurt" ? -3 : 0;
  const y = pose === "down" ? 8 : 0;
  shadow(ctx, 24);
  px(ctx, 16 + lean, 34 + y, 16, 6, "#6E7894");
  outlinedOval(ctx, 24 + lean, 24 + y, 10, 14, "#8EA2C8");
  px(ctx, 16 + lean, 16 + y, 16, 4, "#C9B4FF");
  px(ctx, 18 + lean, 20 + y, 12, 3, "#5B9BE6");
  diamond(ctx, 24 + lean, 10 + y, 7, "#D9CCFF");
  if (pose === "atk0") px(ctx, 30 + lean, 18 + y, 3, 16, "#F2C567");
  else if (pose === "atk1") px(ctx, 32 + lean, 24 + y, 14, 3, "#F2C567");
  else px(ctx, 30 + lean, 20 + y, 3, 18, "#E8D48A");
  eyes(ctx, 24 + lean, 22 + y, pose === "hurt" || pose === "down" ? "shut" : "focus", 4);
}

export function drawSimpleEnemy(ctx: CanvasRenderingContext2D, kind: SimpleKind, pose: EnemyPose): void {
  if (kind === "slimeGreen") drawSlime(ctx, pose, false);
  else if (kind === "slimeBlue") drawSlime(ctx, pose, true);
  else if (kind === "mushroom") drawMushroom(ctx, pose);
  else if (kind === "bat") drawBat(ctx, pose, false);
  else if (kind === "crystalBat") drawBat(ctx, pose, true);
  else if (kind === "spirit") drawSpirit(ctx, pose);
  else if (kind === "crystal") drawCrystal(ctx, pose);
  else if (kind === "ghost") drawGhost(ctx, pose);
  else drawSentinel(ctx, pose);
}

export function drawGuardian(ctx: CanvasRenderingContext2D, pose: EnemyPose): void {
  const down = pose === "down";
  const y = down ? 10 : pose === "idle1" ? -1 : 0;
  oval(ctx, 40, 70, 22, 5, "rgba(24,36,55,0.28)");
  outlinedOval(ctx, 40, 54 + y, 18, 12, "#8C8578");
  outlinedOval(ctx, 40, 38 + y, 16, 12, "#A59E90");
  outlinedOval(ctx, 40, 24 + y, 13, 11, "#B7B1A4");
  oval(ctx, 30, 50 + y, 6, 3, "#67C58D");
  oval(ctx, 48, 36 + y, 5, 3, "#3E8F55");
  oval(ctx, 34, 22 + y, 4, 2, "#67C58D");
  const armY = pose === "atk0" ? 20 : pose === "atk1" ? 48 : 36;
  outlinedOval(ctx, pose === "atk1" ? 62 : 18, armY + y, 7, 6, "#8C8578");
  if (pose === "atk1") {
    px(ctx, 20, 62, 28, 4, "#6E6A62");
    px(ctx, 24, 66, 6, 3, "#C8B89A");
    px(ctx, 40, 66, 5, 3, "#C8B89A");
  }
  eyes(ctx, 40, 24 + y, pose === "hurt" || down ? "shut" : "happy", 5);
  smile(ctx, 40, 30 + y);
}

export function drawDragon(ctx: CanvasRenderingContext2D, pose: EnemyPose, phase2: boolean): void {
  const body = phase2 ? "#3A2A62" : "#5C4A8C";
  const belly = phase2 ? "#6A58A8" : "#C9B6F2";
  const wing = phase2 ? "#7A5AD0" : "#8E74C4";
  const y = pose === "idle1" ? -2 : pose === "down" ? 8 : 0;
  const up = pose === "idle0" || pose === "atk0";
  oval(ctx, 48, 72, 24, 5, "rgba(24,36,55,0.3)");
  if (pose !== "down") {
    outlinedOval(ctx, 24, 28 + y + (up ? -6 : 2), 16, up ? 10 : 6, wing);
    outlinedOval(ctx, 74, 30 + y + (up ? -4 : 4), 14, up ? 8 : 5, wing);
  }
  outlinedOval(ctx, 50, 46 + y, 24, 16, body);
  oval(ctx, 50, 50 + y, 12, 7, belly);
  outlinedOval(ctx, 74, 36 + y, 8, 7, body);
  outlinedOval(ctx, 86, 32 + y, 12, 9, phase2 ? "#4A3878" : "#6A58A0");
  px(ctx, 92, 30 + y, 8, 4, "#F2C567");
  px(ctx, 18, 50 + y, 12, 5, body);
  px(ctx, 78, 24 + y, 4, 6, phase2 ? "#F2C567" : "#C9B4FF");
  eyes(ctx, 86, 30 + y, pose === "hurt" || pose === "down" ? "shut" : phase2 ? "focus" : "happy", 4);
  if (pose !== "hurt" && pose !== "down") smile(ctx, 90, 36 + y);
  if (pose === "atk1") {
    oval(ctx, 104, 34 + y, 6, 5, phase2 ? "#F2C567" : "#8EC5FF");
    oval(ctx, 112, 32 + y, 3, 3, "#FFF2D6");
  }
  if (phase2) {
    px(ctx, 40, 30 + y, 3, 3, "#F2C567");
    px(ctx, 60, 26 + y, 2, 2, "#E7D6FF");
    px(ctx, 30, 40 + y, 2, 2, "#F2C567");
  }
}

export type IconName = "sword" | "shield" | "star" | "potion" | "crystal" | "heart";

export function drawIcon(ctx: CanvasRenderingContext2D, name: IconName): void {
  if (name === "sword") {
    px(ctx, 14, 4, 4, 18, "#F4F7FB");
    px(ctx, 12, 6, 8, 3, "#D5DEEA");
    px(ctx, 10, 20, 12, 4, "#F2C567");
    px(ctx, 14, 24, 4, 6, "#8A5A32");
  } else if (name === "shield") {
    outlinedOval(ctx, 16, 14, 10, 12, "#5B9BE6");
    px(ctx, 15, 6, 2, 16, "#F2C567");
    px(ctx, 8, 13, 16, 2, "#F2C567");
  } else if (name === "star") {
    diamond(ctx, 16, 16, 10, "#F2C567");
    diamond(ctx, 16, 16, 4, "#FFF2D6");
    px(ctx, 14, 4, 4, 4, "#F2C567");
    px(ctx, 4, 14, 4, 4, "#F2C567");
    px(ctx, 24, 14, 4, 4, "#F2C567");
  } else if (name === "potion") {
    px(ctx, 13, 3, 6, 4, "#C9863A");
    outlinedOval(ctx, 16, 18, 8, 9, "#E66D67");
    oval(ctx, 16, 18, 4, 4, "#FFD0CB");
  } else if (name === "crystal") {
    diamond(ctx, 16, 16, 11, "#9368D7");
    diamond(ctx, 16, 17, 5, "#E4D8FF");
  } else {
    outlinedOval(ctx, 11, 13, 6, 6, "#E66D67");
    outlinedOval(ctx, 21, 13, 6, 6, "#E66D67");
    diamond(ctx, 16, 22, 8, "#E66D67");
  }
}
