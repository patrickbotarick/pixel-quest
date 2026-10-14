import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import { playHeroPose, playImpact } from "../art/playPose.ts";
import { COLOR } from "../GameConfig.ts";
import { getStage } from "../logic/stages.ts";
import { loadSave } from "../logic/saveManager.ts";
import { addSceneBackdrop, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

interface VictoryData {
  stageId?: number;
  stars?: number;
  crystal?: boolean;
}

export class VictoryScene extends Phaser.Scene {
  private stageId = 1;
  private stars = 1;
  private crystal = false;

  constructor() {
    super("victory");
  }

  init(data: VictoryData): void {
    this.stageId = data.stageId ?? 1;
    this.stars = data.stars ?? 1;
    this.crystal = data.crystal === true;
  }

  create(): void {
    const stage = getStage(this.stageId);
    addSceneBackdrop(this, "world.victory.background", `bg_${stage.biome}`);
    if (this.textures.exists("ui.panel_victory")) {
      this.add.nineslice(860, 340, "ui.panel_victory", undefined, 520, 460, 12, 12, 12, 12).setDepth(2);
    }
    const anim = new AnimationController(this);
    const heroOfficial = this.textures.exists("samuca.victory") || this.textures.exists("samuca.idle");
    const hero = this.add
      .sprite(260, heroOfficial ? 620 : 500, heroOfficial ? "samuca.idle" : "hero_win0", 0)
      .setOrigin(0.5, heroOfficial ? 0.9375 : 1)
      .setScale(heroOfficial ? 2.5 : 4)
      .setDepth(3);
    playHeroPose(this, anim, hero, "win", 3, true);
    if (this.crystal) {
      const crystalKey = this.textures.exists("ui.crystal") ? "ui.crystal" : "crystal";
      this.add.image(430, 470, crystalKey).setScale(crystalKey === "ui.crystal" ? 2.2 : 3).setDepth(4);
      playImpact(this, "crystal_recovered", 430, 470, 1.6, loadSave().settings.reduceMotion);
    }
    const title = this.add.text(860, 160, "FASE CONCLUÍDA!", pixelText(22)).setOrigin(0.5).setDepth(4);
    title.setStroke("#182437", 7);
    this.add.text(860, 220, stage.name, uiText(24)).setOrigin(0.5).setDepth(4).setStroke("#182437", 4);
    if (this.crystal) {
      const crystal = this.add.text(860, 268, "CRISTAL DA IMAGINAÇÃO!", uiText(20, "#F2C567")).setOrigin(0.5).setDepth(4);
      crystal.setStroke("#182437", 4);
    }
    const reduce = loadSave().settings.reduceMotion;
    const starKey = (filled: boolean) => (this.textures.exists(filled ? "ui.star" : "ui.star_empty") ? (filled ? "ui.star" : "ui.star_empty") : "star");
    for (let i = 0; i < 3; i++) {
      const earned = i < this.stars;
      const official = this.textures.exists("ui.star");
      const star = this.add.image(780 + i * 80, 330, starKey(earned)).setScale(official ? 1.8 : 3).setDepth(4).setAlpha(earned || official ? 1 : 0.45);
      if (!official && !earned) star.setTint(0x6d7c96);
      if (!reduce && earned) {
        star.setScale(0.2);
        this.time.delayedCall(250 * i, () => {
          this.tweens.add({ targets: star, scale: official ? 1.8 : 3, duration: 280, ease: "Back.Out" });
          getAudio(this).sfx("star");
          playImpact(this, "star_earned", star.x, star.y, 1.2, false);
        });
      }
    }
    const audio = getAudio(this);
    audio.unlock();
    audio.playMusic("victory");
    audio.sfx("victory");
    if (this.stageId < 10) {
      new UiButton(this, 860, 430, 400, 72, "PRÓXIMA FASE", () => this.scene.start("battle", { stageId: this.stageId + 1 }));
    } else {
      new UiButton(this, 860, 430, 400, 72, "VER O FINAL", () => this.scene.start("ending"));
    }
    new UiButton(this, 860, 520, 300, 60, "MAPA", () => this.scene.start("stages"), { fontSize: 24 });
    this.add.rectangle(0, 0, 1, 1, COLOR.ink, 0);
  }
}
