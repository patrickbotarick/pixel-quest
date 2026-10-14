import type { Rng } from "./rng.ts";
import type { Outcome } from "./types.ts";

export interface ReflexConfig {
  period: number;
  zone: number;
  time: number;
  zoneStart: number;
}

export function reflexTuning(stageId: number, help: boolean): { period: number; zone: number; time: number } {
  let period = stageId <= 6 ? 2.6 : stageId <= 8 ? 2.15 : 1.85;
  let zone = stageId <= 6 ? 0.3 : stageId <= 8 ? 0.24 : 0.2;
  let time = 10;
  if (help) {
    period *= 1.25;
    zone = Math.min(0.46, zone + 0.08);
    time = 12;
  }
  return { period, zone, time };
}

export function placeZone(width: number, rng: Rng): number {
  const zone = Math.min(0.7, Math.max(0.08, width));
  const min = 0.04;
  const max = 1 - zone - 0.04;
  if (max <= min) return min;
  return min + rng() * (max - min);
}

export function makeReflex(stageId: number, rng: Rng, help: boolean): ReflexConfig {
  const tuning = reflexTuning(stageId, help);
  return { ...tuning, zoneStart: placeZone(tuning.zone, rng) };
}

/** Ping-pong 0..1. `period` is the time to cross the bar once. */
export function markerAt(elapsed: number, period: number): number {
  const p = Math.max(0.25, period);
  const cycle = p * 2;
  const t = ((elapsed % cycle) + cycle) % cycle;
  const phase = t / p;
  return phase <= 1 ? phase : 2 - phase;
}

export function gradeReflex(pos: number | null, zoneStart: number, zone: number): Outcome {
  if (pos === null || Number.isNaN(pos)) return "miss";
  if (pos >= zoneStart && pos <= zoneStart + zone) return "perfect";
  return "partial";
}
