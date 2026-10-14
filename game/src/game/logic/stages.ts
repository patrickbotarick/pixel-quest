import type { StageDef } from "./types.ts";

export const STAGES: readonly StageDef[] = [
  {
    id: 1,
    name: "Primeiro Desafio",
    region: "forest",
    biome: "forest",
    music: "forest",
    enemies: [{ kind: "slimeGreen", name: "Slime Verde", hp: 40, damage: 5 }],
  },
  {
    id: 2,
    name: "Slimes Travessos",
    region: "forest",
    biome: "forest",
    music: "forest",
    enemies: [
      { kind: "slimeGreen", name: "Slime Verde", hp: 35, damage: 6 },
      { kind: "slimeBlue", name: "Slime Azul", hp: 35, damage: 6 },
    ],
  },
  {
    id: 3,
    name: "Bosque dos Cogumelos",
    region: "forest",
    biome: "forest",
    music: "forest",
    enemies: [
      { kind: "mushroom", name: "Cogumelo Travesso", hp: 40, damage: 6 },
      { kind: "mushroom", name: "Cogumelo Travesso", hp: 40, damage: 6 },
    ],
  },
  {
    id: 4,
    name: "Caminho das Sombras",
    region: "forest",
    biome: "forest",
    music: "forest",
    enemies: [
      { kind: "bat", name: "Morcego da Floresta", hp: 35, damage: 7 },
      { kind: "spirit", name: "Espírito da Floresta", hp: 35, damage: 7 },
      { kind: "slimeBlue", name: "Slime Azul", hp: 35, damage: 7 },
    ],
  },
  {
    id: 5,
    name: "Guardião de Pedra",
    region: "forest",
    biome: "ruins",
    music: "guardian",
    enemies: [{ kind: "guardian", name: "Guardião de Pedra", hp: 140, damage: 9, boss: true }],
  },
  {
    id: 6,
    name: "Cavernas de Cristal",
    region: "cave",
    biome: "cave",
    music: "cave",
    enemies: [
      { kind: "crystal", name: "Cristal Vivo", hp: 45, damage: 7 },
      { kind: "crystal", name: "Cristal Vivo", hp: 45, damage: 7 },
    ],
  },
  {
    id: 7,
    name: "Ecos da Caverna",
    region: "cave",
    biome: "cave",
    music: "cave",
    enemies: [
      { kind: "crystalBat", name: "Morcego de Cristal", hp: 35, damage: 7 },
      { kind: "crystalBat", name: "Morcego de Cristal", hp: 35, damage: 7 },
      { kind: "crystalBat", name: "Morcego de Cristal", hp: 35, damage: 7 },
    ],
  },
  {
    id: 8,
    name: "Salão dos Sentinelas",
    region: "cave",
    biome: "cave",
    music: "cave",
    enemies: [
      { kind: "sentinel", name: "Sentinela de Cristal", hp: 60, damage: 8 },
      { kind: "sentinel", name: "Sentinela de Cristal", hp: 60, damage: 8 },
    ],
  },
  {
    id: 9,
    name: "Portões Sombrios",
    region: "cave",
    biome: "cave",
    music: "cave",
    enemies: [
      { kind: "ghost", name: "Fantasminha", hp: 40, damage: 8 },
      { kind: "sentinel", name: "Sentinela de Cristal", hp: 55, damage: 8 },
      { kind: "crystal", name: "Cristal Vivo", hp: 45, damage: 8 },
    ],
  },
  {
    id: 10,
    name: "Dragão das Sombras",
    region: "cave",
    biome: "sanctuary",
    music: "dragon",
    enemies: [{ kind: "dragon", name: "Dragão das Sombras", hp: 180, damage: 10, boss: true }],
  },
];

export function getStage(id: number): StageDef {
  const stage = STAGES.find((item) => item.id === id);
  if (!stage) throw new Error(`Fase inválida: ${id}`);
  return stage;
}
