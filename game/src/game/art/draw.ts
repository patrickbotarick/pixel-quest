export function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

export function oval(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  if (rx <= 0 || ry <= 0) return;
  ctx.fillStyle = color;
  const ryi = Math.ceil(ry);
  for (let y = -ryi; y <= ryi; y++) {
    const ny = y / ry;
    if (ny * ny > 1) continue;
    const nx = rx * Math.sqrt(Math.max(0, 1 - ny * ny));
    const x0 = Math.round(cx - nx);
    const x1 = Math.round(cx + nx);
    ctx.fillRect(x0, Math.round(cy + y), Math.max(1, x1 - x0), 1);
  }
}

export function diamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  const ri = Math.ceil(r);
  for (let y = -ri; y <= ri; y++) {
    const w = ri - Math.abs(y);
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), Math.max(1, w * 2), 1);
  }
}

export function outlinedOval(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  outline = "#182437",
): void {
  oval(ctx, cx, cy, rx + 1.2, ry + 1.2, outline);
  oval(ctx, cx, cy, rx, ry, fill);
}

export type Mood = "happy" | "shut" | "wow" | "focus";

export function eyes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  mood: Mood,
  gap = 7,
): void {
  if (mood === "shut") {
    px(ctx, x - gap - 2, y, 5, 2, "#24334C");
    px(ctx, x + gap - 2, y, 5, 2, "#24334C");
    return;
  }
  px(ctx, x - gap - 2, y - 2, 5, 6, "#FFFaf0");
  px(ctx, x + gap - 2, y - 2, 5, 6, "#FFFaf0");
  const pupil = mood === "wow" ? 3 : 2;
  px(ctx, x - gap - 1, y, pupil, pupil + 1, "#24334C");
  px(ctx, x + gap, y, pupil, pupil + 1, "#24334C");
  if (mood === "focus") {
    px(ctx, x - gap - 2, y - 3, 5, 1, "#24334C");
    px(ctx, x + gap - 2, y - 3, 5, 1, "#24334C");
  }
}

export function smile(ctx: CanvasRenderingContext2D, x: number, y: number, big = false): void {
  px(ctx, x - 3, y, 2, 1, "#C47A62");
  px(ctx, x - 1, y + 1, big ? 4 : 3, 1, "#C47A62");
  px(ctx, x + 2, y, 2, 1, "#C47A62");
}

export function blush(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, x - 10, y, 4, 2, "#F0A0A0");
  px(ctx, x + 7, y, 4, 2, "#F0A0A0");
}
