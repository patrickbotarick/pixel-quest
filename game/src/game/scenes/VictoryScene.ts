import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import { playHeroPose, playImpact } from "../art/playPose.ts";
import { getStage } from "../logic/stages.ts";
import { loadSave } from "../logic/saveManager.ts";
import { victoryMessage } from "../ui/sceneCopy.ts";
import { addSceneBackdrop, addUiPanel, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

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
    const content = addUiPanel(this, "ui.panel_victory", 860, 350, 560, 620).content;
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
    const title = this.add.text(860, 112, "FASE CONCLUÍDA!", pixelText(22)).setOrigin(0.5);
    title.setStroke("#182437", 7);
    const stageName = this.add.text(860, 168, stage.name, uiText(26)).setOrigin(0.5).setStroke("#182437", 4);
    const message = this.add.text(860, 238, victoryMessage(this.stageId), { ...uiText(26, "#F2C567"), align: "center", wordWrap: { width: 480 } }).setOrigin(0.5).setStroke("#182437", 4);
    content.add([title, stageName, message]);
    const reduce = loadSave().settings.reduceMotion;
    const starKey = (filled: boolean) => (this.textures.exists(filled ? "ui.star" : "ui.star_empty") ? (filled ? "ui.star" : "ui.star_empty") : "star");
    for (let i = 0; i < 3; i++) {
      const earned = i < this.stars;
      const official = this.textures.exists("ui.star");
      const star = this.add.image(780 + i * 80, 330, starKey(earned)).setScale(official ? 1.8 : 3).setDepth(4).setAlpha(earned || official ? 1 : 0.45);
      content.add(star);
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
      content.add(new UiButton(this, 860, 434, 440, 88, "PRÓXIMA FASE", () => this.scene.start("battle", { stageId: this.stageId + 1 })).root);
    } else {
      content.add(new UiButton(this, 860, 434, 440, 88, "VER O FINAL", () => this.scene.start("ending")).root);
    }
    content.add(new UiButton(this, 860, 548, 440, 88, "VOLTAR AO MAPA", () => this.scene.start("stages"), { fontSize: 26 }).root);
  }
}
