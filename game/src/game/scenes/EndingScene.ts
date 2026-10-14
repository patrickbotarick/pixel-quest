import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import { playEnemyPose, playHeroPose } from "../art/playPose.ts";
import { loadSave } from "../logic/saveManager.ts";
import { addSceneBackdrop, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

export class EndingScene extends Phaser.Scene {
  constructor() {
    super("ending");
  }

  create(): void {
    const illustrated = this.textures.exists("world.ending");
    addSceneBackdrop(this, "world.ending", "bg_sanctuary");
    const save = loadSave();
    const total = save.stars.reduce((sum, value) => sum + value, 0);
    const textX = illustrated ? 420 : 640;
    if (this.textures.exists("ui.panel_victory")) {
      this.add.nineslice(640, illustrated ? 656 : 170, "ui.panel_victory", undefined, illustrated ? 1220 : 760, illustrated ? 112 : 230, 12, 12, 12, 12).setDepth(2);
    }
    if (!illustrated) {
      const anim = new AnimationController(this);
      const hero = this.add.image(340, 500, "hero_win0").setOrigin(0.5, 1).setScale(4);
      playHeroPose(this, anim, hero, "win", 3, true);
      const dragon = this.add.image(980, 470, "dragon_p2_down").setOrigin(0.5, 1).setScale(2.8);
      playEnemyPose(this, anim, dragon, "dragon", "down", true, 2, false);
      this.add.image(560, 360, "crystal").setScale(2.6);
      this.add.image(650, 390, "crystal").setScale(3.1);
    }
    const title = this.add.text(textX, illustrated ? 632 : 90, "PARABÉNS, HERÓI!", pixelText(illustrated ? 14 : 26)).setOrigin(0.5).setDepth(4);
    title.setStroke("#182437", 8);
    const msg = this.add.text(textX, illustrated ? 672 : 160, "Os cristais da imaginação voltaram.", uiText(illustrated ? 16 : 26)).setOrigin(0.5).setDepth(4);
    msg.setStroke("#182437", 4);
    this.add.text(illustrated ? 860 : textX, illustrated ? 656 : 210, `${total} de 30 estrelas`, uiText(18, "#F2C567")).setOrigin(0.5).setDepth(4).setStroke("#182437", 4);
    new UiButton(this, illustrated ? 1110 : textX, illustrated ? 656 : 620, 260, 64, "MAPA", () => this.scene.start("stages"));
    const audio = getAudio(this);
    audio.playMusic("ending");
    audio.sfx("victory");
  }
}
