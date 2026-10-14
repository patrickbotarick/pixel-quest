import Phaser from "phaser";
import { VIEW_H, VIEW_W } from "./GameConfig.ts";
import { BattleScene } from "./scenes/BattleScene.ts";
import { BootScene } from "./scenes/BootScene.ts";
import { EndingScene } from "./scenes/EndingScene.ts";
import { GameOverScene } from "./scenes/GameOverScene.ts";
import { HowToScene } from "./scenes/HowToScene.ts";
import { MainMenuScene } from "./scenes/MainMenuScene.ts";
import { PauseScene } from "./scenes/PauseScene.ts";
import { PreloadScene } from "./scenes/PreloadScene.ts";
import { SettingsScene } from "./scenes/SettingsScene.ts";
import { StageSelectScene } from "./scenes/StageSelectScene.ts";
import { VictoryScene } from "./scenes/VictoryScene.ts";

export function createGame(parent: HTMLElement): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIEW_W,
    height: VIEW_H,
    backgroundColor: "#121a28",
    banner: false,
    disableContextMenu: true,
    roundPixels: true,
    antialias: false,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: VIEW_W,
      height: VIEW_H,
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
    input: {
      activePointers: 3,
    },
    scene: [
      BootScene,
      PreloadScene,
      MainMenuScene,
      StageSelectScene,
      BattleScene,
      VictoryScene,
      GameOverScene,
      EndingScene,
      PauseScene,
      HowToScene,
      SettingsScene,
    ],
  });
  // Opt-in development fixture for isolated browser regression tests.
  // The production build removes this block; no user save is changed here.
  const testHost = window as unknown as { __pqTestGame?: Phaser.Game };
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "ui") {
    testHost.__pqTestGame = game;
    game.events.once("destroy", () => { delete testHost.__pqTestGame; });
  }
  game.events.once("destroy", () => {
    const audio = game.registry.get("audio") as { dispose?: () => void } | undefined;
    audio?.dispose?.();
  });
  parent.addEventListener("pointerdown", () => {
    const audio = game.registry.get("audio") as { unlock?: () => void } | undefined;
    audio?.unlock?.();
  });
  document.getElementById("boot-label")?.remove();
  return game;
}
