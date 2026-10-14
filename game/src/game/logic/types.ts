export type ChallengeKind = "math" | "memory" | "reflex";
export type Outcome = "perfect" | "partial" | "miss";
export type EnemyKind =
  | "slimeGreen"
  | "slimeBlue"
  | "mushroom"
  | "bat"
  | "spirit"
  | "crystal"
  | "crystalBat"
  | "ghost"
  | "sentinel"
  | "guardian"
  | "dragon";

export type Biome = "forest" | "ruins" | "cave" | "sanctuary";
export type RegionId = "forest" | "cave";
export type BattleMusic = "forest" | "cave" | "guardian" | "dragon";

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  hp: number;
  damage: number;
  boss?: boolean;
}

export interface StageDef {
  id: number;
  name: string;
  region: RegionId;
  biome: Biome;
  music: BattleMusic;
  enemies: EnemyDef[];
}

export interface Fighter {
  id: string;
  kind: EnemyKind;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  boss: boolean;
}

export interface Tutorials {
  math: boolean;
  memory: boolean;
  reflex: boolean;
}

export const HERO_MAX_HP = 100;
export const PERFECT_DAMAGE = 20;
export const PARTIAL_DAMAGE = 5;
export const MISS_DAMAGE = 0;
