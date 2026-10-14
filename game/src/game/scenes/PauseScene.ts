import Phaser from "phaser";
import { COLOR } from "../GameConfig.ts";
import { pixelText, UiButton } from "../ui/widgets.ts";
import type { BattleScene } from "./BattleScene.ts";

interface PauseData {
  stageId?: number;
}

export class PauseScene extends Phaser.Scene {
  private stageId = 1;

  constructor() {
    super("pause");
  }

  init(data: PauseData): void {
    this.stageId = data.stageId ?? 1;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(8,12,24,0.62)");
    if (this.textures.exists("ui.panel_menu")) {
      this.add.nineslice(640, 380, "ui.panel_menu", undefined, 560, 520, 12, 12, 12, 12);
    } else {
      this.add.rectangle(640, 360, 560, 520, COLOR.ink, 0.94).setStrokeStyle(5, COLOR.gold);
    }
    const title = this.add.text(640, 170, "PAUSA", pixelText(32)).setOrigin(0.5);
    title.setStroke("#182437", 6);
    const buttons = [
      ["CONTINUAR", () => this.continueGame()],
      ["REINICIAR", () => this.restart()],
      ["CONFIGURAÇÕES", () => this.openSettings()],
      ["MAPA", () => this.toMap()],
    ] as const;
    buttons.forEach(([label, action], index) => {
      new UiButton(this, 640, 270 + index * 88, 400, 72, label, action);
    });
    this.input.keyboard?.on("keydown-ESC", () => this.continueGame());
    this.events.once("shutdown", () => this.input.keyboard?.off("keydown-ESC"));
  }

  private continueGame(): void {
    const battle = this.scene.get("battle") as BattleScene;
    battle.notifyResume();
    this.scene.resume("battle");
    this.scene.stop();
  }

  private restart(): void {
    const stageId = this.stageId;
    this.scene.stop("battle");
    this.scene.start("battle", { stageId });
  }

  private openSettings(): void {
    this.scene.launch("settings", { back: "pause" });
    this.scene.pause();
  }

  private toMap(): void {
    const battle = this.scene.get("battle") as BattleScene;
    battle.persistTutorials();
    this.scene.stop("battle");
    this.scene.start("stages");
  }
}
