import type { Rng } from "./rng.ts";
import type { ChallengeKind } from "./types.ts";

export function challengePool(stageId: number): ChallengeKind[] {
  if (stageId <= 2) return ["math"];
  if (stageId <= 4) return ["math", "memory"];
  return ["math", "memory", "reflex"];
}

export class ChallengeManager {
  readonly history: ChallengeKind[] = [];
  private readonly stageId: number;
  private readonly rng: Rng;

  constructor(stageId: number, rng: Rng) {
    this.stageId = stageId;
    this.rng = rng;
  }

  next(): ChallengeKind {
    const pool = challengePool(this.stageId);
    let choices = pool;
    const last = this.history[this.history.length - 1];
    const prev = this.history[this.history.length - 2];
    if (last && last === prev) {
      const filtered = pool.filter((kind) => kind !== last);
      if (filtered.length > 0) choices = filtered;
    }
    const index = Math.min(choices.length - 1, Math.floor(this.rng() * choices.length));
    const kind = choices[index] ?? "math";
    this.history.push(kind);
    return kind;
  }
}
