import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import { playEnemyPose, playHeroPose } from "../art/playPose.ts";
import { loadSave } from "../logic/saveManager.ts";
import { addSceneBackdrop, addUiPanel, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

export class EndingScene extends Phaser.Scene {
  constructor() {
    super("ending");
  }

  create(): void {
    const illustrated = this.textures.exists("world.ending");
    addSceneBackdrop(this, "world.ending", "bg_sanctuary");
    const save = loadSave();
    const total = save.stars.reduce((sum, value) => sum + value, 0);
    const content = addUiPanel(this, "ui.panel_victory", 640, 570, 1220, 268).content;
    if (!illustrated) {
      const anim = new AnimationController(this);
      const hero = this.add.image(340, 420, "hero_win0").setOrigin(0.5, 1).setScale(4);
      playHeroPose(this, anim, hero, "win", 3, true);
      const dragon = this.add.image(980, 420, "dragon_p2_down").setOrigin(0.5, 1).setScale(2.8);
      playEnemyPose(this, anim, dragon, "dragon", "down", true, 2, false);
      this.add.image(560, 360, "crystal").setScale(2.6);
      this.add.image(650, 390, "crystal").setScale(3.1);
    }
    const title = this.add.text(640, 474, "PARABÉNS!", pixelText(28)).setOrigin(0.5);
    title.setStroke("#182437", 8);
    const celebration = this.add.text(640, 522, "VOCÊ E O SAMUCA SALVARAM O REINO!", uiText(30)).setOrigin(0.5).setStroke("#182437", 4);
    const msg = this.add.text(640, 564, "Os cristais da imaginação voltaram.", uiText(26)).setOrigin(0.5);
    msg.setStroke("#182437", 4);
    const stars = this.add.text(1040, 474, `${total} de 30 estrelas`, uiText(22, "#F2C567")).setOrigin(0.5).setStroke("#182437", 4);
    content.add([title, celebration, msg, stars]);
    content.add(new UiButton(this, 400, 646, 440, 88, "MENU PRINCIPAL", () => this.scene.start("menu")).root);
    content.add(new UiButton(this, 880, 646, 440, 88, "MAPA DAS FASES", () => this.scene.start("stages")).root);
    const audio = getAudio(this);
    audio.playMusic("ending");
    audio.sfx("victory");
  }
}
