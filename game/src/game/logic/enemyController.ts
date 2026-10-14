import type { Fighter } from "./types.ts";
import { clampHp } from "./damage.ts";

export function living(enemies: readonly Fighter[]): Fighter[] {
  return enemies.filter((enemy) => enemy.hp > 0);
}

export function applyHit(hp: number, damage: number): number {
  return clampHp(hp - Math.max(0, damage));
}

/** Next living enemy after `cursor`. Cursor -1 selects the first living fighter. */
export function nextAttackerIndex(enemies: readonly Fighter[], cursor: number): number {
  const count = enemies.length;
  if (count === 0) return -1;
  const base = ((cursor % count) + count) % count;
  for (let step = 1; step <= count; step++) {
    const index = (base + step) % count;
    if ((enemies[index]?.hp ?? 0) > 0) return index;
  }
  return -1;
}
