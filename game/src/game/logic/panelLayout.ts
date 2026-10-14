/** Layout do painel de desafios em coordenadas do mundo 1280×720. Sem Phaser. */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export const DESIGN_W = 1280;
export const DESIGN_H = 720;
export const PANEL_TOP = 476;

export function challengePanel(viewW = DESIGN_W, viewH = DESIGN_H, panelTop = PANEL_TOP): Box {
  const h = viewH - panelTop - 16;
  const w = Math.min(1240, viewW - 40);
  return { x: (viewW - w) / 2, y: panelTop + 8, w, h };
}

/** Faixa compartilhada pelo cronômetro e pela barra de reflexo. */
export function trackSpan(panel: Box): { x: number; w: number } {
  const w = Math.min(760, panel.w - 48);
  const x = panel.x + Math.max(24, (panel.w - w) / 2);
  return { x, w };
}

export function memoryPlayfield(panel: Box): Box {
  const header = 66;
  const padBottom = 12;
  const padX = 36;
  const y = panel.y + header;
  return {
    x: panel.x + padX,
    y,
    w: panel.w - padX * 2,
    h: Math.max(0, panel.h - header - padBottom),
  };
}

export interface MemoryGrid {
  columns: number;
  rows: number;
  cardW: number;
  cardH: number;
  gapX: number;
  gapY: number;
  hitW: number;
  hitH: number;
  touchTargetMet: boolean;
  positions: Point[];
}

/** Horizontal first; a second row is used only when it improves small targets.
 * All dimensions derive from the playfield and its actual CSS scale.
 */
export function memoryGrid(cardCount: number, area: Box, cssScale = 1): MemoryGrid {
  const count = Math.max(1, Math.floor(cardCount));
  const scale = Math.max(0.01, cssScale);
  const minTouch = 44 / scale;
  const measure = (columns: number) => {
    const rows = Math.ceil(count / columns);
    const gapY = rows > 1 ? Math.min(12, area.h / 10) : 0;
    const minGapX = Math.min(16, area.w / (columns * 10));
    const maxW = Math.max(1, (area.w - minGapX * (columns - 1)) / columns);
    const maxH = Math.max(1, (area.h - gapY * (rows - 1)) / rows);
    const cardH = Math.min(maxH, maxW * 84 / 68);
    const cardW = cardH * 68 / 84;
    const hitW = Math.min(maxW, Math.max(cardW, minTouch));
    const hitH = Math.min(maxH, Math.max(cardH, minTouch));
    const gapX = Math.max(0, (area.w - columns * hitW) / (columns + 1));
    return { columns, rows, cardW, cardH, hitW, hitH, gapX, gapY };
  };
  let layout = measure(count);
  if (count > 4 && Math.min(layout.hitW, layout.hitH) * scale < 44) {
    const fallback = measure(3);
    if (Math.min(fallback.hitW, fallback.hitH) > Math.min(layout.hitW, layout.hitH)) layout = fallback;
  }
  const { columns, rows, cardW, cardH, hitW, hitH, gapX, gapY } = layout;
  const gridW = columns * hitW + (columns - 1) * gapX;
  const gridH = rows * hitH + (rows - 1) * gapY;
  const originX = area.x + (area.w - gridW) / 2 + hitW / 2;
  const originY = area.y + (area.h - gridH) / 2 + hitH / 2;
  const positions: Point[] = [];
  for (let index = 0; index < count; index++) {
    const col = index % columns;
    const row = Math.floor(index / columns);
    positions.push({
      x: originX + col * (hitW + gapX),
      y: originY + row * (hitH + gapY),
    });
  }
  return { columns, rows, cardW, cardH, hitW, hitH, gapX, gapY, touchTargetMet: Math.min(hitW, hitH) * scale >= 43.99, positions };
}

export function cardBox(center: Point, cardW: number, cardH: number): Box {
  return { x: center.x - cardW / 2, y: center.y - cardH / 2, w: cardW, h: cardH };
}

export interface MathControls {
  equation: Point;
  buttons: { x: number; y: number; w: number; h: number }[];
}

export function mathControls(panel: Box): MathControls {
  const buttonW = 300;
  const buttonH = 72;
  const gap = 36;
  const total = buttonW * 3 + gap * 2;
  const start = panel.x + (panel.w - total) / 2 + buttonW / 2;
  const y = panel.y + panel.h - 16 - buttonH / 2;
  return {
    equation: { x: panel.x + panel.w / 2, y: panel.y + 100 },
    buttons: [0, 1, 2].map((index) => ({
      x: start + index * (buttonW + gap),
      y,
      w: buttonW,
      h: buttonH,
    })),
  };
}

export interface ReflexControls {
  track: Box;
  markerY: number;
  hit: Box;
}

export function reflexControls(panel: Box): ReflexControls {
  const span = trackSpan(panel);
  const trackH = 28;
  const trackY = panel.y + 116;
  return {
    track: { x: span.x, y: trackY - trackH / 2, w: span.w, h: trackH },
    markerY: trackY - 14,
    hit: {
      x: panel.x + 48,
      y: panel.y + 78,
      w: panel.w - 96,
      h: panel.h - 78 - 14,
    },
  };
}

export function zoneBox(track: Box, zoneStart: number, zone: number): Box {
  const start = Math.min(1, Math.max(0, zoneStart));
  const width = Math.min(1 - start, Math.max(0, zone));
  return { x: track.x + start * track.w, y: track.y, w: width * track.w, h: track.h };
}

export function containsBox(outer: Box, inner: Box, slack = 0.51): boolean {
  return (
    inner.x >= outer.x - slack &&
    inner.y >= outer.y - slack &&
    inner.x + inner.w <= outer.x + outer.w + slack &&
    inner.y + inner.h <= outer.y + outer.h + slack
  );
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Phaser Scale.FIT: o mundo inteiro cabe na viewport, sem rolagem. */
export function fitFrame(viewportW: number, viewportH: number, designW = DESIGN_W, designH = DESIGN_H) {
  const scale = Math.min(viewportW / designW, viewportH / designH);
  const w = designW * scale;
  const h = designH * scale;
  return {
    scale,
    x: (viewportW - w) / 2,
    y: (viewportH - h) / 2,
    w,
    h,
    fits: w <= viewportW + 0.01 && h <= viewportH + 0.01,
  };
}
