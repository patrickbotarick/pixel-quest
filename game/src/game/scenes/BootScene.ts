import Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    if (!this.registry.get("audio")) this.registry.set("audio", new AudioManager());
    this.scene.start("preload");
  }
}
