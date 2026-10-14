import Phaser from "phaser";
import { generateAllTextures } from "../art/generateTextures.ts";
import { ASSET_BASE, layersJsonPath, sharedAssetIds } from "../art/officialCatalog.ts";
import { queueAssets, registerAnimations, type PixelQuestManifest } from "../art/phaserAssets.ts";
import { COLOR } from "../GameConfig.ts";
import type { Biome } from "../logic/types.ts";
import { uiText } from "../ui/widgets.ts";

const BIOMES: Biome[] = ["forest", "ruins", "cave", "sanctuary"];

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload(): void {
    this.cameras.main.setBackgroundColor("#121a28");
    this.load.xhr.timeout = 20000;
    const label = this.add.text(640, 330, "CARREGANDO", uiText(32)).setOrigin(0.5);
    const bar = this.add.rectangle(440, 400, 8, 18, COLOR.gold).setOrigin(0, 0.5);
    this.load.on("progress", (value: number) => {
      bar.width = 8 + Math.round(400 * value);
    });
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.error("[pixel-quest] recurso não carregou", file.key, file.src);
    });
    this.load.json("pqManifest", `${ASSET_BASE}assets.manifest.json`);
    this.load.json("pqStageMap", `${ASSET_BASE}08_world/stage_map/stages.json`);
    for (const biome of BIOMES) this.load.json(`${biome}.layers`, `${ASSET_BASE}${layersJsonPath(biome)}`);
    this.load.on("filecomplete", (key: string) => {
      if (key !== "pqManifest") return;
      try {
        const manifest = this.cache.json.get("pqManifest") as PixelQuestManifest;
        if (!manifest?.assets) return;
        this.registry.set("pqManifest", manifest);
        queueAssets(this, manifest, ASSET_BASE, new Set(sharedAssetIds(manifest)));
      } catch (err) {
        console.error("[pixel-quest] manifesto inválido", err);
      }
    });
  }

  create(): void {
    const manifest = this.registry.get("pqManifest") as PixelQuestManifest | undefined;
    let opened = false;
    const go = () => {
      if (opened) return;
      opened = true;
      try {
        generateAllTextures(this);
        if (manifest?.assets) registerAnimations(this, manifest);
        this.scene.start("menu");
      } catch (err) {
        console.error("[pixel-quest] falha ao abrir o menu", err);
        this.add.text(640, 360, "Não foi possível abrir o menu.", uiText(28)).setOrigin(0.5);
      }
    };
    this.time.delayedCall(4000, go);
    if (typeof document !== "undefined" && document.fonts?.ready) void document.fonts.ready.then(go, go);
    else go();
  }
}
