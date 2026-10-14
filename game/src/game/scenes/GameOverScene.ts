import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import { playHeroPose } from "../art/playPose.ts";
import { getStage } from "../logic/stages.ts";
import { loadSave, writeSave } from "../logic/saveManager.ts";
import { addSceneBackdrop, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

interface OverData {
  stageId?: number;
  offerHelp?: boolean;
}

export class GameOverScene extends Phaser.Scene {
  private stageId = 1;
  private offerHelp = false;

  constructor() {
    super("gameover");
  }

  init(data: OverData): void {
    this.stageId = data.stageId ?? 1;
    this.offerHelp = data.offerHelp === true;
  }

  create(): void {
    const stage = getStage(this.stageId);
    addSceneBackdrop(this, "world.defeat.background", `bg_${stage.biome}`);
    if (this.textures.exists("ui.panel_defeat")) {
      this.add.nineslice(880, 360, "ui.panel_defeat", undefined, 520, 480, 12, 12, 12, 12).setDepth(2);
    } else {
      this.add.rectangle(640, 360, 1280, 720, 0x121a28, 0.35);
    }
    const anim = new AnimationController(this);
    const official = this.textures.exists("samuca.defeat") || this.textures.exists("samuca.idle");
    const hero = this.add
      .sprite(260, official ? 640 : 520, official ? "samuca.idle" : "hero_lose", 0)
      .setOrigin(0.5, official ? 0.9375 : 1)
      .setScale(official ? 2.4 : 3.6)
      .setDepth(3);
    playHeroPose(this, anim, hero, "lose", 2, false);
    const title = this.add.text(880, 180, "QUASE LÁ!", pixelText(28)).setOrigin(0.5).setDepth(4);
    title.setStroke("#182437", 7);
    const msg = this.add.text(880, 260, "Você consegue.\nVamos tentar de novo?", { ...uiText(24), align: "center" }).setOrigin(0.5).setDepth(4);
    msg.setStroke("#182437", 4);
    getAudio(this).sfx("defeat");
    getAudio(this).playMusic("menu");
    if (this.offerHelp) {
      this.add.text(880, 340, "QUER UMA AJUDINHA?", uiText(22, "#F2C567")).setOrigin(0.5).setDepth(4).setStroke("#182437", 4);
      new UiButton(this, 880, 420, 360, 68, "SIM", () => {
        const save = loadSave();
        save.helpArmed[this.stageId] = true;
        writeSave(save);
        this.scene.start("battle", { stageId: this.stageId });
      });
      new UiButton(this, 880, 500, 360, 60, "AGORA NÃO", () => this.scene.start("battle", { stageId: this.stageId }), { fontSize: 22 });
    } else {
      new UiButton(this, 880, 400, 400, 72, "TENTAR NOVAMENTE", () => this.scene.start("battle", { stageId: this.stageId }));
    }
    new UiButton(this, 880, this.offerHelp ? 580 : 500, 280, 56, "MAPA", () => this.scene.start("stages"), { fontSize: 22 });
  }
}
