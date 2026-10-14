import Phaser from "phaser";
import { loadSave, writeSave, type SaveData } from "../logic/saveManager.ts";
import { COLOR } from "../GameConfig.ts";
import { addSceneBackdrop, getAudio, pixelText, UiButton, uiText } from "../ui/widgets.ts";

interface SettingsData {
  back?: "menu" | "pause";
}

export class SettingsScene extends Phaser.Scene {
  private back: "menu" | "pause" = "menu";
  private volumeText!: Phaser.GameObjects.Text;

  constructor() {
    super("settings");
  }

  init(data: SettingsData): void {
    this.back = data.back ?? "menu";
  }

  create(): void {
    addSceneBackdrop(this, "world.main_menu.background", "bg_forest");
    if (this.textures.exists("ui.panel_settings")) {
      this.add.nineslice(640, 380, "ui.panel_settings", undefined, 760, 560, 12, 12, 12, 12).setDepth(1);
    } else {
      this.add.rectangle(640, 360, 1280, 720, COLOR.ink, 0.45);
    }
    const title = this.add.text(640, 90, "CONFIGURAÇÕES", pixelText(28)).setOrigin(0.5);
    title.setStroke("#182437", 7);
    this.render();
  }

  private render(): void {
    this.children.getByName("settings-body")?.destroy(true);
    const save = loadSave();
    const audio = getAudio(this);
    audio.setMusicEnabled(save.settings.music);
    audio.setSfxEnabled(save.settings.sfx);
    audio.setVolume(save.settings.volume);
    const root = this.add.container(0, 0).setName("settings-body");
    const music = new UiButton(
      this,
      640,
      200,
      520,
      72,
      save.settings.music ? "MÚSICA: LIGADA" : "MÚSICA: DESLIGADA",
      () => this.toggle((next) => {
        next.settings.music = !next.settings.music;
      }),
      { repeat: true },
    );
    const sfx = new UiButton(
      this,
      640,
      286,
      520,
      72,
      save.settings.sfx ? "EFEITOS: LIGADOS" : "EFEITOS: DESLIGADOS",
      () => this.toggle((next) => {
        next.settings.sfx = !next.settings.sfx;
      }),
      { repeat: true },
    );
    const motion = new UiButton(
      this,
      640,
      372,
      520,
      72,
      save.settings.reduceMotion ? "MENOS MOVIMENTO: SIM" : "MENOS MOVIMENTO: NÃO",
      () => this.toggle((next) => {
        next.settings.reduceMotion = !next.settings.reduceMotion;
      }),
      { repeat: true },
    );
    root.add([music.root, sfx.root, motion.root]);
    this.volumeText = this.add.text(640, 450, `VOLUME ${Math.round(save.settings.volume * 100)}`, uiText(24)).setOrigin(0.5);
    root.add(this.volumeText);
    const track = this.add.rectangle(640, 500, 420, 18, 0x121a28).setStrokeStyle(3, COLOR.gold);
    const knob = this.add.circle(440 + save.settings.volume * 420, 500, 18, COLOR.gold).setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(knob);
    knob.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const x = Phaser.Math.Clamp(dragX, 440, 860);
      knob.x = x;
      const volume = (x - 440) / 420;
      const next = loadSave();
      next.settings.volume = volume;
      writeSave(next);
      audio.setVolume(volume);
      this.volumeText.setText(`VOLUME ${Math.round(volume * 100)}`);
    });
    root.add([track, knob]);
    const full = new UiButton(this, 640, 580, 420, 64, "TELA CHEIA", () => {
      const element = document.documentElement;
      if (!document.fullscreenElement) void element.requestFullscreen?.();
      else void document.exitFullscreen?.();
    }, { repeat: true, fontSize: 24 });
    const back = new UiButton(this, 640, 660, 320, 56, "VOLTAR", () => this.close(), { fontSize: 22 });
    root.add([full.root, back.root]);
  }

  private toggle(apply: (save: SaveData) => void): void {
    const next = loadSave();
    apply(next);
    writeSave(next);
    this.time.delayedCall(0, () => this.render());
  }

  private close(): void {
    const back = this.back;
    this.scene.stop();
    if (back === "pause") this.scene.resume("pause");
    else this.scene.wake("menu");
  }
}
