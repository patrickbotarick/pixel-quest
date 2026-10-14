import type { SaveData } from "./saveManager.ts";

export function computeStars(heroHp: number, perfects: number, attempts: number): 1 | 2 | 3 {
  const rate = attempts <= 0 ? 1 : perfects / attempts;
  if (rate >= 0.75 && heroHp >= 40) return 3;
  if (rate >= 0.5 && heroHp > 0) return 2;
  return 1;
}

export function recordVictory(save: SaveData, stageId: number, stars: 1 | 2 | 3): SaveData {
  const next: SaveData = {
    ...save,
    stars: save.stars.slice(),
    cleared: save.cleared.slice(),
    losses: save.losses.slice(),
    helpArmed: save.helpArmed.slice(),
    tutorials: { ...save.tutorials },
    settings: { ...save.settings },
  };
  next.stars[stageId] = Math.max(next.stars[stageId] ?? 0, stars);
  next.cleared[stageId] = true;
  next.losses[stageId] = 0;
  next.helpArmed[stageId] = false;
  if (stageId >= next.unlocked && stageId < 10) next.unlocked = stageId + 1;
  if (stageId === 10) next.completed = true;
  return next;
}

export function recordDefeat(save: SaveData, stageId: number): SaveData {
  const next: SaveData = {
    ...save,
    stars: save.stars.slice(),
    cleared: save.cleared.slice(),
    losses: save.losses.slice(),
    helpArmed: save.helpArmed.slice(),
    tutorials: { ...save.tutorials },
    settings: { ...save.settings },
  };
  next.losses[stageId] = Math.min(99, (next.losses[stageId] ?? 0) + 1);
  return next;
}

export class ProgressionManager {
  static stars = computeStars;
  static recordVictory = recordVictory;
  static recordDefeat = recordDefeat;
}
