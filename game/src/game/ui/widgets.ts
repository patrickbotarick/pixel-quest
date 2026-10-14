import Phaser from "phaser";
import type { AudioManager } from "../audio/AudioManager.ts";
import { COLOR } from "../GameConfig.ts";

export function getAudio(scene: Phaser.Scene): AudioManager {
  return scene.registry.get("audio") as AudioManager;
}

export function uiText(size: number, color = COLOR.cream): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: "Nunito, sans-serif", fontSize: `${size}px`, color, fontStyle: "bold" };
}

export function pixelText(size: number): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: `${size}px`,
    color: COLOR.cream,
    align: "center",
  };
}

export function addBackdrop(scene: Phaser.Scene, key: string): Phaser.GameObjects.Image {
  return scene.add.image(640, 360, key).setDisplaySize(1280, 720).setDepth(0);
}

export function addSceneBackdrop(scene: Phaser.Scene, official: string, fallback: string): Phaser.GameObjects.Image {
  return addBackdrop(scene, scene.textures.exists(official) ? official : fallback);
}

/** One display-list entry: the opaque frame is always behind its content.
 * Child depth cannot lift a child above a separate scene-level panel.
 */
export function addUiPanel(scene: Phaser.Scene, key: string, x: number, y: number, w: number, h: number) {
  const root = scene.add.container(0, 0).setName("ui-panel").setDepth(10);
  const frame = scene.textures.exists(key)
    ? scene.add.nineslice(x, y, key, undefined, w, h, 12, 12, 12, 12)
    : scene.add.rectangle(x, y, w, h, COLOR.ink, 0.96).setStrokeStyle(4, COLOR.gold);
  const content = scene.add.container(0, 0).setName("ui-panel-content");
  root.add([frame, content]);
  return { root, content };
}

export function addStars(scene: Phaser.Scene, x: number, y: number, earned: number, scale = 2.2): Phaser.GameObjects.Image[] {
  const official = scene.textures.exists("ui.star") && scene.textures.exists("ui.star_empty");
  const stars: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 3; i++) {
    const filled = i < earned;
    const key = official ? (filled ? "ui.star" : "ui.star_empty") : "star";
    const star = scene.add.image(x + (i - 1) * 22 * scale, y, key).setScale(official ? scale * 0.55 : scale);
    if (!official && !filled) star.setTint(0x6d7c96);
    stars.push(star);
  }
  return stars;
}

export interface RatioMeter {
  setRatio(ratio: number): void;
}

export function makeMeter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  variant: "hero" | "enemy" | "boss",
): RatioMeter {
  scene.add.text(x, y - 20, label, uiText(16)).setOrigin(0.5).setDepth(31).setStroke("#182437", 4);
  const frameKey = variant === "hero" ? "ui.hp_hero_frame" : variant === "boss" ? "ui.hp_boss_frame" : "ui.hp_enemy_frame";
  const fillKey = variant === "hero" ? "ui.hp_hero_fill" : variant === "boss" ? "ui.hp_boss_fill" : "ui.hp_enemy_fill";
  if (scene.textures.exists(frameKey) && scene.textures.exists(fillKey)) {
    const width = variant === "boss" ? 220 : variant === "hero" ? 168 : 136;
    scene.add.nineslice(x, y, frameKey, undefined, width, 22, 6, 6, 6, 6).setDepth(31);
    const fill = scene.add.image(x - width / 2 + 10, y, fillKey).setOrigin(0, 0.5).setDepth(32);
    fill.setDisplaySize(width - 20, 8);
    return {
      setRatio(ratio: number) {
        const clamped = Math.max(0, Math.min(1, ratio));
        fill.setCrop(0, 0, Math.max(1, Math.round(fill.width * clamped)), fill.height);
        fill.setVisible(clamped > 0.01);
      },
    };
  }
  scene.add.rectangle(x - 46, y, 92, 12, 0x121a28).setOrigin(0, 0.5).setStrokeStyle(2, COLOR.gold).setDepth(31);
  const bar = scene.add.rectangle(x - 44, y, 88, 8, COLOR.red).setOrigin(0, 0.5).setDepth(32);
  return {
    setRatio(ratio: number) {
      bar.scaleX = Math.max(0.001, Math.min(1, ratio));
    },
  };
}

interface ButtonOptions {
  hint?: string;
  repeat?: boolean;
  fontSize?: number;
}

export class UiButton {
  readonly root: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private slice?: Phaser.GameObjects.NineSlice;
  private tone: "normal" | "good" | "bad" | "hot" = "normal";
  private used = false;
  private readonly repeat: boolean;
  private enabled = true;
  private pressed = false;
  private focused = false;
  private readonly hit: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly w: number,
    private readonly h: number,
    label: string,
    private readonly onClick: () => void,
    options: ButtonOptions = {},
  ) {
    this.repeat = options.repeat === true;
    this.root = scene.add.container(x, y).setName(`button:${label}`);
    this.bg = scene.add.graphics();
    const parts: Phaser.GameObjects.GameObject[] = [this.bg];
    if (scene.textures.exists("ui.button_primary_normal")) {
      this.slice = scene.add.nineslice(0, 0, "ui.button_primary_normal", undefined, w, h, 12, 12, 12, 12);
      parts.push(this.slice);
    } else {
      this.paint();
    }
    const text = scene.add.text(0, options.hint ? -10 : 0, label, uiText(options.fontSize ?? (options.hint ? 34 : 28))).setOrigin(0.5);
    text.setStroke("#182437", 4);
    parts.push(text);
    if (options.hint) parts.push(scene.add.text(0, 24, options.hint, uiText(16)).setOrigin(0.5).setStroke("#182437", 3));
    const hit = scene.add.rectangle(0, 0, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    this.hit = hit;
    hit.on("pointerover", () => {
      if (!this.enabled) return;
      if (this.tone === "good" || this.tone === "bad") return;
      this.tone = "hot";
      this.paint();
    });
    hit.on("pointerout", () => {
      this.pressed = false;
      if (this.tone === "hot") {
        this.tone = "normal";
        this.paint();
      }
    });
    hit.on("pointerdown", () => {
      if (!this.enabled || (this.used && !this.repeat)) return;
      this.pressed = true;
      this.paint();
      if (!this.repeat) this.used = true;
      const audio = getAudio(scene);
      audio.unlock();
      audio.sfx("click");
      this.onClick();
    });
    hit.on("pointerup", () => { this.pressed = false; this.paint(); });
    parts.push(hit);
    this.root.add(parts);
    if (this.slice) this.paint();
  }

  setTone(tone: "normal" | "good" | "bad"): void {
    this.tone = tone;
    this.used = true;
    this.paint();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.hit.input) this.hit.input.enabled = enabled;
    this.paint();
  }

  setFocused(focused: boolean): void {
    this.focused = focused;
    this.paint();
  }

  private paint(): void {
    if (this.slice) {
      const key =
        !this.enabled
          ? "ui.button_primary_disabled"
          : this.pressed
            ? "ui.button_primary_pressed"
            : this.tone === "hot" || this.focused
          ? "ui.button_primary_hover"
          : this.tone === "normal"
            ? "ui.button_primary_normal"
            : "ui.button_primary_pressed";
      if (this.slice.scene.textures.exists(key)) this.slice.setTexture(key);
      if (!this.enabled) this.slice.setTint(0x9bb0c9);
      else if (this.tone === "good") this.slice.setTint(0xb7f3c9);
      else if (this.tone === "bad") this.slice.setTint(0xffb4b0);
      else this.slice.clearTint();
      return;
    }
    const fill = !this.enabled ? 0x354052 : this.tone === "good" ? 0x2f7a49 : this.tone === "bad" ? 0x8d4550 : this.tone === "hot" || this.focused || this.pressed ? 0x314868 : 0x24344c;
    const border = this.tone === "good" ? 0x67c58d : this.tone === "bad" ? 0xe66d67 : COLOR.gold;
    this.bg.clear();
    this.bg.fillStyle(COLOR.ink, 1);
    this.bg.fillRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h, 14);
    this.bg.fillStyle(fill, 1);
    this.bg.fillRoundedRect(-this.w / 2 + 4, -this.h / 2 + 4, this.w - 8, this.h - 8, 12);
    this.bg.lineStyle(4, border, 1);
    this.bg.strokeRoundedRect(-this.w / 2 + 2, -this.h / 2 + 2, this.w - 4, this.h - 4, 14);
  }
}
