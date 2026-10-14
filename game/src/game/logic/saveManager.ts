import type { Tutorials } from "./types.ts";

export const SAVE_VERSION = 1;
export const SAVE_KEY = "pixel-quest-save-v1";
export const SAVE_BACKUP_KEY = "pixel-quest-save-backup";

export interface Settings {
  music: boolean;
  sfx: boolean;
  volume: number;
  reduceMotion: boolean;
}

export interface SaveData {
  version: number;
  unlocked: number;
  stars: number[];
  cleared: boolean[];
  losses: number[];
  helpArmed: boolean[];
  tutorials: Tutorials;
  completed: boolean;
  settings: Settings;
}

export interface Kv {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

let memoryBlob: string | null = null;

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    unlocked: 1,
    stars: Array.from({ length: 11 }, () => 0),
    cleared: Array.from({ length: 11 }, () => false),
    losses: Array.from({ length: 11 }, () => 0),
    helpArmed: Array.from({ length: 11 }, () => false),
    tutorials: { math: false, memory: false, reflex: false },
    completed: false,
    settings: { music: true, sfx: true, volume: 0.85, reduceMotion: false },
  };
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

function mergeNumbers(value: unknown, length: number, min: number, max: number): number[] {
  const out = Array.from({ length }, () => 0);
  if (!Array.isArray(value)) return out;
  for (let i = 0; i < length; i++) out[i] = clamp(value[i], min, max, 0);
  return out;
}

function mergeBools(value: unknown, length: number): boolean[] {
  const out = Array.from({ length }, () => false);
  if (!Array.isArray(value)) return out;
  for (let i = 0; i < length; i++) out[i] = value[i] === true;
  return out;
}

export function sanitizeSave(raw: unknown): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  base.unlocked = Math.round(clamp(data.unlocked, 1, 10, 1));
  base.completed = data.completed === true;
  base.stars = mergeNumbers(data.stars, 11, 0, 3);
  base.cleared = mergeBools(data.cleared, 11);
  base.losses = mergeNumbers(data.losses, 11, 0, 99);
  base.helpArmed = mergeBools(data.helpArmed, 11);
  if (data.tutorials && typeof data.tutorials === "object") {
    const tutorials = data.tutorials as Record<string, unknown>;
    base.tutorials = {
      math: tutorials.math === true,
      memory: tutorials.memory === true,
      reflex: tutorials.reflex === true,
    };
  }
  if (data.settings && typeof data.settings === "object") {
    const settings = data.settings as Record<string, unknown>;
    base.settings = {
      music: settings.music !== false,
      sfx: settings.sfx !== false,
      volume: clamp(settings.volume, 0, 1, 0.85),
      reduceMotion: settings.reduceMotion === true,
    };
  }
  base.version = SAVE_VERSION;
  return base;
}

function browserKv(): Kv | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function loadSave(kv: Kv | null = browserKv()): SaveData {
  if (!kv) {
    if (!memoryBlob) return defaultSave();
    try {
      return sanitizeSave(JSON.parse(memoryBlob));
    } catch {
      return defaultSave();
    }
  }
  try {
    const raw = kv.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return sanitizeSave(JSON.parse(raw));
  } catch {
    try {
      const backup = kv.getItem(SAVE_BACKUP_KEY);
      if (!backup) return defaultSave();
      return sanitizeSave(JSON.parse(backup));
    } catch {
      return defaultSave();
    }
  }
}

export function writeSave(data: SaveData, kv: Kv | null = browserKv()): void {
  const payload = JSON.stringify({ ...sanitizeSave(data), version: SAVE_VERSION });
  if (!kv) {
    memoryBlob = payload;
    return;
  }
  try {
    const previous = kv.getItem(SAVE_KEY);
    if (previous) kv.setItem(SAVE_BACKUP_KEY, previous);
    kv.setItem(SAVE_KEY, payload);
  } catch {
    memoryBlob = payload;
  }
}

export function hasProgress(save: SaveData): boolean {
  return save.completed || save.unlocked > 1 || save.cleared.some((cleared, index) => index > 0 && cleared);
}

export class SaveManager {
  static load = loadSave;
  static write = writeSave;
  static hasProgress = hasProgress;
  static defaultSave = defaultSave;
}
