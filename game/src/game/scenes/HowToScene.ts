import Phaser from "phaser";
import { HOW_TO_PAGES } from "../ui/sceneCopy.ts";
import { addSceneBackdrop, addUiPanel, pixelText, UiButton, uiText } from "../ui/widgets.ts";

interface HowData {
  back?: "menu";
}

export class HowToScene extends Phaser.Scene {
  private page = 0;
  private content!: Phaser.GameObjects.Container;
  private body?: Phaser.GameObjects.Container;

  constructor() {
    super("howto");
  }

  init(_data: HowData): void {
    this.page = 0;
  }

  create(): void {
    addSceneBackdrop(this, "world.main_menu.background", "bg_forest");
    this.content = addUiPanel(this, "ui.panel_menu", 640, 360, 880, 660).content;
    this.show();
  }

  private show(): void {
    this.body?.destroy(true);
    const info = HOW_TO_PAGES[this.page]!;
    const root = this.add.container(0, 0).setName("howto-body");
    this.body = root;
    this.content.add(root);
    const title = this.add.text(640, 100, info.title, pixelText(28)).setOrigin(0.5);
    title.setStroke("#182437", 7);
    const page = this.add.text(640, 150, `${this.page + 1} / ${HOW_TO_PAGES.length}`, uiText(22, "#F2C567")).setOrigin(0.5);
    const icon = this.add.image(640, 230, info.icon).setScale(4);
    const text = this.add.text(640, 370, info.text, { ...uiText(32), align: "center" }).setOrigin(0.5);
    text.setStroke("#182437", 5);
    root.add([title, page, icon, text]);
    if (this.page > 0) {
      const prev = new UiButton(this, 430, 530, 280, 84, "ANTERIOR", () => {
        this.page -= 1;
        this.time.delayedCall(0, () => this.show());
      });
      root.add(prev.root);
    }
    const nextLabel = this.page === HOW_TO_PAGES.length - 1 ? "ENTENDI" : "PRÓXIMO";
    const next = new UiButton(this, this.page > 0 ? 850 : 640, 530, 300, 84, nextLabel, () => {
      if (this.page === HOW_TO_PAGES.length - 1) {
        this.close();
        return;
      }
      this.page += 1;
      this.time.delayedCall(0, () => this.show());
    });
    root.add(next.root);
    root.add(new UiButton(this, 640, 634, 320, 80, "VOLTAR", () => this.close()).root);
  }

  private close(): void {
    this.scene.stop();
    this.scene.wake("menu");
  }
}
