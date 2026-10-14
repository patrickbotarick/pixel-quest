import Phaser from "phaser";
import { addUiPanel, pixelText, UiButton } from "../ui/widgets.ts";
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
    const content = addUiPanel(this, "ui.panel_menu", 640, 380, 560, 540).content;
    const title = this.add.text(640, 170, "PAUSA", pixelText(32)).setOrigin(0.5);
    title.setStroke("#182437", 6);
    content.add(title);
    const buttons = [
      ["CONTINUAR", () => this.continueGame()],
      ["REINICIAR", () => this.restart()],
      ["CONFIGURAÇÕES", () => this.openSettings()],
      ["MAPA", () => this.toMap()],
    ] as const;
    buttons.forEach(([label, action], index) => {
      content.add(new UiButton(this, 640, 264 + index * 96, 420, 84, label, action).root);
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
