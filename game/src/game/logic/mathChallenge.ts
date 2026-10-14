import type { Rng } from "./rng.ts";
import { shuffle } from "./rng.ts";
import type { Outcome } from "./types.ts";

export interface MathConfig {
  max: number;
  cap: number;
  sub: boolean;
  time: number;
}

export interface MathProblem {
  a: number;
  b: number;
  op: "+" | "-";
  answer: number;
  options: number[];
}

export function mathConfig(stageId: number, help: boolean): MathConfig {
  let max = stageId <= 2 ? 10 : stageId <= 6 ? 15 : 20;
  let cap = stageId <= 2 ? 6 : stageId <= 6 ? 9 : 12;
  const sub = stageId >= 4;
  let time = 10;
  if (help) {
    max = Math.max(5, Math.round(max * 0.7));
    cap = Math.max(4, cap - 2);
    time = 13;
  }
  return { max, cap, sub, time };
}

function distractors(answer: number, rng: Rng): number[] {
  const near: number[] = [];
  const far: number[] = [];
  for (let d = 1; d <= 3; d++) {
    if (answer - d >= 0) near.push(answer - d);
    near.push(answer + d);
  }
  for (let d = 4; d <= 6; d++) {
    if (answer - d >= 0) far.push(answer - d);
    far.push(answer + d);
  }
  const picked: number[] = [];
  for (const n of [...shuffle(near, rng), ...shuffle(far, rng)]) {
    if (n !== answer && n >= 0 && !picked.includes(n)) picked.push(n);
    if (picked.length === 2) break;
  }
  while (picked.length < 2) {
    const n = answer + picked.length + 1;
    if (!picked.includes(n)) picked.push(n);
  }
  return picked;
}

export function makeMath(stageId: number, rng: Rng, help: boolean): MathProblem {
  const cfg = mathConfig(stageId, help);
  let a = 1;
  let b = 1;
  let op: "+" | "-" = "+";
  for (let attempt = 0; attempt < 30; attempt++) {
    const useSub = cfg.sub && rng() < 0.45;
    if (useSub) {
      a = 1 + Math.floor(rng() * cfg.max);
      const maxB = Math.min(a, cfg.cap);
      b = Math.floor(rng() * (maxB + 1));
      op = "-";
      break;
    }
    const cap = Math.min(cfg.cap, cfg.max - 1);
    if (cap < 1) continue;
    a = 1 + Math.floor(rng() * cap);
    const maxB = Math.min(cfg.cap, cfg.max - a);
    if (maxB < 1) continue;
    b = 1 + Math.floor(rng() * maxB);
    op = "+";
    break;
  }
  const answer = op === "+" ? a + b : a - b;
  const options = shuffle([answer, ...distractors(answer, rng)], rng);
  return { a, b, op, answer, options };
}

export function gradeMath(problem: MathProblem, choice: number | null): Outcome {
  if (choice === null) return "miss";
  return choice === problem.answer ? "perfect" : "partial";
}
