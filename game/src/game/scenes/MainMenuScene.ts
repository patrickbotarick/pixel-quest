import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import { playEnemyPose, playHeroPose } from "../art/playPose.ts";
import { officialScale } from "../art/officialCatalog.ts";
import { hasProgress, loadSave } from "../logic/saveManager.ts";
import { addSceneBackdrop, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

export class MainMenuScene extends Phaser.Scene {
  private anim!: AnimationController;

  constructor() {
    super("menu");
  }

  create(): void {
    this.anim = new AnimationController(this);
    addSceneBackdrop(this, "world.main_menu.background", "bg_forest");
    if (this.textures.exists("brand.logo")) {
      this.add.image(640, 78, "brand.logo").setScale(1.45).setDepth(5);
    } else {
      const title = this.add.text(640, 92, "PIXEL QUEST", pixelText(42)).setOrigin(0.5).setDepth(5);
      title.setStroke("#182437", 8);
    }
    const sub = this.add.text(640, 148, "Aventura dos Desafios", uiText(28)).setOrigin(0.5).setDepth(5);
    sub.setStroke("#182437", 5);
    const heroKey = this.textures.exists("samuca.idle") ? "samuca.idle" : "hero_idle0";
    const heroOfficial = heroKey === "samuca.idle";
    const hero = this.add
      .sprite(240, heroOfficial ? 640 : 520, heroKey, 0)
      .setOrigin(0.5, heroOfficial ? 0.9375 : 1)
      .setScale(heroOfficial ? 2.5 : 4)
      .setDepth(4);
    const slimeOfficial = this.textures.exists("slime_green.idle");
    const slime = this.add
      .sprite(430, slimeOfficial ? 655 : 530, slimeOfficial ? "slime_green.idle" : "slimeGreen_idle0", 0)
      .setOrigin(0.5, slimeOfficial ? 0.9375 : 1)
      .setScale(slimeOfficial ? officialScale("slimeGreen") : 3.2)
      .setDepth(4);
    if (slimeOfficial) slime.setFlipX(true);
    playHeroPose(this, this.anim, hero, "idle", 2.2, true);
    playEnemyPose(this, this.anim, slime, "slimeGreen", "idle", false, 2.5, true);
    if (!heroOfficial) {
      const cloudA = this.add.image(180, 90, "cloud").setScale(3).setAlpha(0.85);
      const cloudB = this.add.image(760, 130, "cloud").setScale(2.4).setAlpha(0.75);
      this.tweens.add({ targets: cloudA, x: 1500, duration: 28000, repeat: -1, onRepeat: () => cloudA.setX(-200) });
      this.tweens.add({ targets: cloudB, x: 1500, duration: 36000, repeat: -1, onRepeat: () => cloudB.setX(-180) });
    }
    this.layout();
    const onWake = () => {
      this.layout();
      getAudio(this).playMusic("menu");
    };
    this.events.on("wake", onWake);
    this.events.once("shutdown", () => this.events.off("wake", onWake));
    getAudio(this).playMusic("menu");
    const ready = window as unknown as { __pqReady?: boolean };
    ready.__pqReady = true;
  }

  private layout(): void {
    this.children.getByName("menu-buttons")?.destroy(true);
    const save = loadSave();
    const root = this.add.container(0, 0).setName("menu-buttons");
    const buttons: { label: string; action: () => void }[] = [];
    if (!hasProgress(save)) {
      buttons.push({ label: "JOGAR", action: () => this.scene.start("battle", { stageId: 1 }) });
    } else {
      buttons.push({ label: "JOGAR", action: () => this.scene.start("stages") });
      buttons.push({
        label: "CONTINUAR",
        action: () => {
          let stage = save.unlocked;
          for (let id = 1; id <= save.unlocked; id++) {
            if (!save.cleared[id]) {
              stage = id;
              break;
            }
          }
          this.scene.start("battle", { stageId: stage });
        },
      });
    }
    buttons.push({
      label: "COMO JOGAR",
      action: () => {
        this.scene.sleep();
        this.scene.launch("howto", { back: "menu" });
      },
    });
    buttons.push({
      label: "CONFIGURAÇÕES",
      action: () => {
        this.scene.sleep();
        this.scene.launch("settings", { back: "menu" });
      },
    });
    buttons.forEach((button, index) => {
      const y = 250 + index * 92;
      const ui = new UiButton(this, 980, y, 420, 76, button.label, button.action);
      root.add(ui.root);
    });
  }
}
