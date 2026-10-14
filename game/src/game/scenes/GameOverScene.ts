import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import { playHeroPose } from "../art/playPose.ts";
import { getStage } from "../logic/stages.ts";
import { loadSave, writeSave } from "../logic/saveManager.ts";
import { addSceneBackdrop, addUiPanel, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

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
    const content = addUiPanel(this, "ui.panel_defeat", 880, 360, 560, 580).content;
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
    content.add([title, msg]);
    getAudio(this).sfx("defeat");
    getAudio(this).playMusic("menu");
    if (this.offerHelp) {
      content.add(this.add.text(880, 340, "QUER UMA AJUDINHA?", uiText(22, "#F2C567")).setOrigin(0.5).setStroke("#182437", 4));
      content.add(new UiButton(this, 880, 420, 400, 80, "SIM", () => {
        const save = loadSave();
        save.helpArmed[this.stageId] = true;
        writeSave(save);
        this.scene.start("battle", { stageId: this.stageId });
      }).root);
      content.add(new UiButton(this, 880, 510, 400, 80, "AGORA NÃO", () => this.scene.start("battle", { stageId: this.stageId }), { fontSize: 24 }).root);
    } else {
      content.add(new UiButton(this, 880, 400, 440, 88, "TENTAR NOVAMENTE", () => this.scene.start("battle", { stageId: this.stageId })).root);
    }
    content.add(new UiButton(this, 880, this.offerHelp ? 606 : 514, 400, 80, "MAPA", () => this.scene.start("stages"), { fontSize: 26 }).root);
  }
}
