import { diamond, oval, px } from "./draw.ts";

function mix(a: string, b: string, t: number): string {
  const parse = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(ar!, br!)}${c(ag!, bg!)}${c(ab!, bb!)}`;
}

function sky(ctx: CanvasRenderingContext2D, w: number, h: number, top: string, bottom: string): void {
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = mix(top, bottom, y / h);
    ctx.fillRect(0, y, w, 2);
  }
}

function hill(ctx: CanvasRenderingContext2D, cx: number, base: number, rx: number, ry: number, color: string): void {
  oval(ctx, cx, base, rx, ry, color);
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, leaf: string): void {
  px(ctx, x, y, 6 * scale, 16 * scale, "#5A3B28");
  oval(ctx, x + 3 * scale, y - 2 * scale, 14 * scale, 12 * scale, "#182437");
  oval(ctx, x + 3 * scale, y - 4 * scale, 12 * scale, 10 * scale, leaf);
  oval(ctx, x - 4 * scale, y + 2 * scale, 8 * scale, 7 * scale, leaf);
  oval(ctx, x + 10 * scale, y + 1 * scale, 8 * scale, 7 * scale, leaf);
}

function crystalCluster(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  diamond(ctx, x, y, 16, "#182437");
  diamond(ctx, x, y, 14, color);
  diamond(ctx, x - 14, y + 8, 9, "#182437");
  diamond(ctx, x - 14, y + 8, 7, "#C7B6FF");
  diamond(ctx, x + 16, y + 10, 8, "#7EB6FF");
}

export function drawForest(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  sky(ctx, w, h, "#8FD0FF", "#E7F6C8");
  oval(ctx, w * 0.78, 54, 22, 22, "#FFF6D2");
  hill(ctx, 80, h - 70, 180, 70, "#3E7A58");
  hill(ctx, 320, h - 50, 220, 80, "#315C48");
  hill(ctx, 560, h - 64, 180, 70, "#2C6A4E");
  tree(ctx, 40, h - 120, 1.1, "#3E8F55");
  tree(ctx, 120, h - 140, 1.4, "#2F7A49");
  tree(ctx, 470, h - 132, 1.2, "#67C58D");
  tree(ctx, 540, h - 118, 0.9, "#2F7A49");
  for (let i = 0; i < 8; i++) {
    oval(ctx, 30 + i * 80, h - 78, 10, 6, i % 2 ? "#F2C567" : "#E66D67");
  }
  px(ctx, 0, h - 48, w, 48, "#2A6B45");
  px(ctx, 0, h - 48, w, 6, "#67C58D");
}

export function drawRuins(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  sky(ctx, w, h, "#9CC7E8", "#D7E6C4");
  hill(ctx, 120, h - 40, 240, 90, "#4E6A52");
  hill(ctx, 460, h - 30, 260, 80, "#3E5848");
  px(ctx, 70, 90, 28, 120, "#8D8A82");
  px(ctx, 110, 70, 24, 140, "#A8A49A");
  px(ctx, 146, 100, 22, 110, "#7E7A72");
  px(ctx, 70, 78, 100, 16, "#B7B2A6");
  oval(ctx, 120, 150, 18, 10, "#67C58D");
  px(ctx, 430, 120, 20, 90, "#8A867C");
  px(ctx, 470, 100, 36, 110, "#9C978C");
  px(ctx, 430, 108, 76, 12, "#C2BBAE");
  crystalCluster(ctx, 300, 150, "#9AD7FF");
  px(ctx, 0, h - 46, w, 46, "#4A6248");
  px(ctx, 0, h - 46, w, 5, "#6E8A62");
}

export function drawCave(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  sky(ctx, w, h, "#1B2438", "#31425C");
  for (let i = 0; i < 7; i++) {
    const x = 30 + i * 95;
    px(ctx, x, 0, 18, 50 + (i % 3) * 16, "#24344C");
    diamond(ctx, x + 8, 54, 6, i % 2 ? "#7EB6FF" : "#C7B6FF");
  }
  hill(ctx, 100, h - 20, 180, 80, "#24344C");
  hill(ctx, 360, h - 10, 220, 90, "#1C2A40");
  hill(ctx, 560, h - 24, 160, 70, "#2C3E5A");
  crystalCluster(ctx, 180, h - 110, "#6EC8FF");
  crystalCluster(ctx, 420, h - 130, "#B794F0");
  crystalCluster(ctx, 520, h - 100, "#7EE0C8");
  px(ctx, 0, h - 42, w, 42, "#182437");
  px(ctx, 0, h - 42, w, 4, "#5B9BE6");
}

export function drawSanctuary(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  sky(ctx, w, h, "#2A2150", "#6A5AAA");
  oval(ctx, w * 0.5, 40, 70, 18, "rgba(242,197,103,0.35)");
  for (let i = 0; i < 5; i++) {
    px(ctx, 80 + i * 110, 0, 10, h, "rgba(255,242,214,0.08)");
  }
  hill(ctx, 160, h - 20, 200, 80, "#3A3168");
  hill(ctx, 460, h - 10, 220, 90, "#2C254E");
  crystalCluster(ctx, 120, h - 120, "#E7D6FF");
  crystalCluster(ctx, 300, h - 150, "#F2C567");
  crystalCluster(ctx, 480, h - 126, "#9AD7FF");
  px(ctx, 250, h - 150, 16, 70, "#C9B48A");
  px(ctx, 220, h - 90, 76, 12, "#E6D3A2");
  px(ctx, 0, h - 40, w, 40, "#241C40");
  px(ctx, 0, h - 40, w, 4, "#F2C567");
}

export function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  sky(ctx, w, h, "#7EC8F0", "#D9F3C4");
  px(ctx, 0, 0, w / 2, h, "#D7F0C8");
  px(ctx, w / 2, 0, w / 2, h, "#D5D0F4");
  hill(ctx, 140, 250, 150, 50, "#67C58D");
  hill(ctx, 300, 280, 120, 40, "#3E8F55");
  tree(ctx, 40, 150, 0.7, "#2F7A49");
  tree(ctx, 180, 120, 0.8, "#3E8F55");
  tree(ctx, 250, 190, 0.6, "#2F7A49");
  crystalCluster(ctx, 470, 150, "#B794F0");
  crystalCluster(ctx, 560, 210, "#7EB6FF");
  hill(ctx, 520, 260, 120, 36, "#6A5AAA");
  px(ctx, w / 2 - 3, 0, 6, h, "#F2C567");
}
