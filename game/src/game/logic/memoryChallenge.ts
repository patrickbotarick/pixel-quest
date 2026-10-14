import type { Rng } from "./rng.ts";
import { shuffle } from "./rng.ts";
import type { Outcome } from "./types.ts";

export const MEMORY_SYMBOLS = ["sword", "shield", "star", "potion", "crystal", "heart"] as const;
export type MemorySymbol = (typeof MEMORY_SYMBOLS)[number];
export const MEMORY_PREVIEW_SEC = 3;

export interface MemoryCard {
  symbol: MemorySymbol;
  up: boolean;
  matched: boolean;
}

export interface MemoryState {
  cards: MemoryCard[];
  found: number;
  pairs: number;
  first: number | null;
  lock: boolean;
  preview: boolean;
}

export type MemoryEvent =
  | { type: "ignore" }
  | { type: "flip"; index: number }
  | { type: "match"; a: number; b: number; done: boolean }
  | { type: "mismatch"; a: number; b: number };

export function memoryPairs(stageId: number): number {
  return stageId >= 7 ? 3 : 2;
}

export function memoryTime(stageId: number, help: boolean): number {
  const base = stageId >= 7 ? 30 : 25;
  return help ? base + 6 : base;
}

export function createMemory(pairs: number, rng: Rng): MemoryState {
  const symbols = MEMORY_SYMBOLS.slice(0, pairs);
  const faces: MemoryCard[] = symbols.flatMap((symbol) => [
    { symbol, up: true, matched: false },
    { symbol, up: true, matched: false },
  ]);
  return {
    cards: shuffle(faces, rng),
    found: 0,
    pairs,
    first: null,
    lock: false,
    preview: true,
  };
}

export function endPreview(state: MemoryState): MemoryState {
  return {
    ...state,
    preview: false,
    first: null,
    lock: false,
    cards: state.cards.map((card) => ({ ...card, up: card.matched })),
  };
}

export function tapCard(state: MemoryState, index: number): { state: MemoryState; event: MemoryEvent } {
  if (state.preview || state.lock) return { state, event: { type: "ignore" } };
  const card = state.cards[index];
  if (!card || card.matched || card.up) return { state, event: { type: "ignore" } };
  const cards = state.cards.map((c, i) => (i === index ? { ...c, up: true } : c));
  if (state.first === null) {
    return { state: { ...state, cards, first: index }, event: { type: "flip", index } };
  }
  const a = state.first;
  const b = index;
  if (cards[a]?.symbol === cards[b]?.symbol) {
    const matched = cards.map((c, i) => (i === a || i === b ? { ...c, matched: true, up: true } : c));
    const found = state.found + 1;
    return {
      state: { ...state, cards: matched, found, first: null, lock: false },
      event: { type: "match", a, b, done: found >= state.pairs },
    };
  }
  return {
    state: { ...state, cards, first: null, lock: true },
    event: { type: "mismatch", a, b },
  };
}

export function closeMismatch(state: MemoryState): MemoryState {
  return {
    ...state,
    lock: false,
    first: null,
    cards: state.cards.map((card) => (card.matched ? card : { ...card, up: false })),
  };
}

export function memoryOutcome(found: number, pairs: number): Outcome {
  if (pairs > 0 && found >= pairs) return "perfect";
  if (found > 0) return "partial";
  return "miss";
}
