import Phaser from "phaser";
import { MAP_NODES } from "../art/officialCatalog.ts";
import { loadSave } from "../logic/saveManager.ts";
import { STAGES } from "../logic/stages.ts";
import { COLOR } from "../GameConfig.ts";
import { addSceneBackdrop, addStars, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super("stages");
  }

  create(): void {
    addSceneBackdrop(this, "world.stage_map.background", "bg_map");
    const title = this.add.text(640, 36, "ESCOLHA A FASE", pixelText(22)).setOrigin(0.5).setDepth(5);
    title.setStroke("#182437", 6);
    this.add.text(640, 72, "Floresta à esquerda  ·  Cavernas à direita", uiText(16)).setOrigin(0.5).setDepth(5).setStroke("#182437", 3);
    const nodes = this.mapNodes();
    const path = this.add.graphics().setDepth(2);
    path.lineStyle(10, 0x1a2a22, 0.55);
    path.beginPath();
    nodes.forEach((point, index) => {
      if (index === 0) path.moveTo(point.x, point.y);
      else path.lineTo(point.x, point.y);
    });
    path.strokePath();
    path.lineStyle(4, COLOR.gold, 0.9);
    path.beginPath();
    nodes.forEach((point, index) => {
      if (index === 0) path.moveTo(point.x, point.y);
      else path.lineTo(point.x, point.y);
    });
    path.strokePath();
    const save = loadSave();
    const official = this.textures.exists("ui.stage_normal");
    STAGES.forEach((stage, index) => {
      const point = nodes[index]!;
      const open = stage.id <= save.unlocked;
      const boss = stage.id === 5 || stage.id === 10;
      const cleared = save.cleared[stage.id] === true;
      if (official) {
        const key = !open ? "ui.stage_locked" : cleared ? "ui.stage_completed" : boss ? "ui.stage_boss" : "ui.stage_normal";
        this.add.image(point.x, point.y, key).setScale(boss ? 1.35 : 1.15).setDepth(3);
      } else {
        const size = boss ? 78 : 64;
        const g = this.add.graphics().setDepth(3);
        g.fillStyle(open ? (boss ? 0x9368d7 : 0x24344c) : 0x2a3344, open ? 1 : 0.85);
        g.fillCircle(point.x, point.y, size / 2);
        g.lineStyle(boss ? 6 : 4, open ? COLOR.gold : 0x66758a, 1);
        g.strokeCircle(point.x, point.y, size / 2);
      }
      if (open) {
        // The completed texture already contains a central green check mark.
        const numberY = official && cleared ? point.y + 72 : point.y - 2;
        this.add.text(point.x, numberY, String(stage.id), uiText(boss ? 22 : 20)).setOrigin(0.5).setDepth(4).setStroke("#182437", 4);
        if (cleared) addStars(this, point.x, point.y + 46, save.stars[stage.id] ?? 0, 0.9).forEach((star) => star.setDepth(4));
        const hit = this.add.rectangle(point.x, point.y + (cleared ? 30 : 0), boss ? 104 : 88, cleared ? 144 : 88, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true }).setDepth(5);
        hit.on("pointerdown", () => {
          getAudio(this).unlock();
          getAudio(this).sfx("confirm");
          this.scene.start("battle", { stageId: stage.id });
        });
      } else if (!official) {
        this.add.text(point.x, point.y - 8, String(stage.id), uiText(22, "#9BB0C9")).setOrigin(0.5).setDepth(4);
        this.add.image(point.x, point.y + 16, "lock").setScale(1.6).setDepth(4);
      }
    });
    const back = new UiButton(this, 130, 40, 180, 52, "VOLTAR", () => this.scene.start("menu"), { fontSize: 20 });
    back.root.setDepth(6);
    getAudio(this).playMusic("menu");
  }

  private mapNodes(): { x: number; y: number }[] {
    const saved = this.cache.json.exists("pqStageMap")
      ? (this.cache.json.get("pqStageMap") as { stages?: { x: number; y: number }[] })
      : undefined;
    if (saved?.stages && saved.stages.length === 10) return saved.stages.map((stage) => ({ x: stage.x, y: stage.y }));
    return MAP_NODES.map((node) => ({ x: node.x, y: node.y }));
  }
}
