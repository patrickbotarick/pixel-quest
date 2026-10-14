import assert from "node:assert/strict";
import { test } from "node:test";
import { memoryGrid, memoryPlayfield, challengePanel, fitFrame, cardBox, containsBox, boxesOverlap } from "./panelLayout.ts";

const viewports = [[1920, 1080], [1366, 768], [1280, 720], [1024, 768], [844, 390], [667, 375]];

for (const [w, h] of viewports) {
  for (const count of [4, 6]) {
    test(`${count} cartas horizontais em ${w}×${h}, proporcionais e com alvos de toque`, () => {
      const frame = fitFrame(w!, h!);
      const area = memoryPlayfield(challengePanel());
      const grid = memoryGrid(count, area, frame.scale);
      assert.equal(grid.columns, count);
      assert.equal(grid.rows, 1);
      assert.ok(Math.abs(grid.cardW / grid.cardH - 68 / 84) < 0.0001);
      assert.ok(grid.cardH >= 140, "cards are significantly larger than the old 69px cells");
      assert.equal(grid.touchTargetMet, true);
      assert.ok(grid.hitW * frame.scale >= 44 - 0.01);
      assert.ok(grid.hitH * frame.scale >= 44 - 0.01);
      const hits = grid.positions.map((point) => cardBox(point, grid.hitW, grid.hitH));
      for (const box of hits) assert.ok(containsBox(area, box));
      for (let i = 0; i < hits.length; i++) {
        for (let j = i + 1; j < hits.length; j++) assert.equal(boxesOverlap(hits[i]!, hits[j]!), false);
      }
    });
  }
}

test("campo estreito e alto usa fallback 3×2 sem corte ou sobreposição", () => {
  const area = { x: 20, y: 50, w: 280, h: 300 };
  const grid = memoryGrid(6, area);
  assert.equal(grid.columns, 3);
  assert.equal(grid.rows, 2);
  assert.equal(grid.touchTargetMet, true);
  const hits = grid.positions.map((point) => cardBox(point, grid.hitW, grid.hitH));
  for (const box of hits) assert.ok(containsBox(area, box));
  for (let i = 0; i < hits.length; i++) {
    for (let j = i + 1; j < hits.length; j++) assert.equal(boxesOverlap(hits[i]!, hits[j]!), false);
  }
});

test("campo sem altura não piora a legibilidade dividindo em duas linhas", () => {
  const grid = memoryGrid(6, { x: 0, y: 0, w: 1168, h: 150 }, 0.25);
  assert.equal(grid.rows, 1);
  assert.equal(grid.touchTargetMet, false);
  assert.ok(grid.cardH === 150);
});
