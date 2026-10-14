import { MISS_DAMAGE, PARTIAL_DAMAGE, PERFECT_DAMAGE, type Outcome } from "./types.ts";

export function attackDamage(outcome: Outcome): number {
  if (outcome === "perfect") return PERFECT_DAMAGE;
  if (outcome === "partial") return PARTIAL_DAMAGE;
  return MISS_DAMAGE;
}

/** About 30% less damage for the optional help attempt. Never zero. */
export function helpedEnemyDamage(base: number, help: boolean): number {
  if (!help) return base;
  return Math.max(1, Math.round(base * 0.7));
}

export function clampHp(hp: number): number {
  return Math.max(0, hp);
}
