import Phaser from "phaser";
import { COLOR } from "../GameConfig.ts";
import { addSceneBackdrop, pixelText, UiButton, uiText } from "../ui/widgets.ts";

const PAGES = [
  { icon: "icon_sword", title: "ATAQUE", text: "Toque no monstro.\nResponda o desafio\npara golpear." },
  { icon: "icon_star", title: "ACERTO", text: "Resposta certa: golpe forte.\nErrou? O golpe fica fraco.\nSem pressa demais!" },
  { icon: "crystal", title: "CRISTAIS", text: "Derrote os monstros.\nPegue os cristais.\nVocê consegue!" },
];

interface HowData {
  back?: "menu";
}

export class HowToScene extends Phaser.Scene {
  private page = 0;

  constructor() {
    super("howto");
  }

  init(_data: HowData): void {
    this.page = 0;
  }

  create(): void {
    addSceneBackdrop(this, "world.main_menu.background", "bg_forest");
    if (this.textures.exists("ui.panel_menu")) {
      this.add.nineslice(640, 360, "ui.panel_menu", undefined, 760, 520, 12, 12, 12, 12).setDepth(1);
    } else {
      this.add.rectangle(640, 360, 1280, 720, COLOR.ink, 0.35);
    }
    this.show();
  }

  private show(): void {
    this.children.getByName("howto-body")?.destroy(true);
    const info = PAGES[this.page]!;
    const root = this.add.container(0, 0).setName("howto-body");
    const title = this.add.text(640, 120, info.title, pixelText(32)).setOrigin(0.5);
    title.setStroke("#182437", 7);
    const icon = this.add.image(640, 250, info.icon).setScale(4);
    const text = this.add.text(640, 390, info.text, { ...uiText(30), align: "center" }).setOrigin(0.5);
    text.setStroke("#182437", 5);
    root.add([title, icon, text]);
    if (this.page > 0) {
      const prev = new UiButton(this, 420, 560, 240, 72, "VOLTAR", () => {
        this.page -= 1;
        this.time.delayedCall(0, () => this.show());
      });
      root.add(prev.root);
    }
    const nextLabel = this.page === PAGES.length - 1 ? "FECHAR" : "PRÓXIMO";
    const next = new UiButton(this, this.page > 0 ? 860 : 640, 560, 280, 72, nextLabel, () => {
      if (this.page === PAGES.length - 1) {
        this.scene.stop();
        this.scene.wake("menu");
        return;
      }
      this.page += 1;
      this.time.delayedCall(0, () => this.show());
    });
    root.add(next.root);
  }
}
