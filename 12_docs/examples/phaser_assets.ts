import Phaser from 'phaser';

export type PixelQuestAsset = {
  id: string; path: string; type: 'image' | 'spritesheet';
  width: number; height: number; frames: number;
  frame_width?: number; frame_height?: number; fps: number | null; loop: boolean;
  origin: { x: number; y: number }; production_status: string;
};
export type PixelQuestManifest = { assets: PixelQuestAsset[] };

// Call in the existing game's preload, after obtaining the approved manifest.
// Example baseURL: '/assets/pixel_quest/' where the contents of dist/ were copied.
export function queueAssets(
  scene: Phaser.Scene, manifest: PixelQuestManifest, baseURL: string,
  requestedIDs?: ReadonlySet<string>
): void {
  const prefix = baseURL.endsWith('/') ? baseURL : baseURL + '/';
  for (const asset of manifest.assets) {
    if (asset.production_status !== 'ready') continue;
    if (requestedIDs && !requestedIDs.has(asset.id)) continue;
    if (scene.textures.exists(asset.id)) continue;
    if (asset.type === 'spritesheet') {
      if (!asset.frame_width || !asset.frame_height) throw new Error(`Missing frame size: ${asset.id}`);
      scene.load.spritesheet(asset.id, prefix + asset.path, {
        frameWidth: asset.frame_width, frameHeight: asset.frame_height,
        startFrame: 0, endFrame: asset.frames - 1, margin: 0, spacing: 0
      });
    } else scene.load.image(asset.id, prefix + asset.path);
  }
}

// Call in create after preload completes. Does not instantiate or replace a game.
export function registerAnimations(scene: Phaser.Scene, manifest: PixelQuestManifest): void {
  for (const asset of manifest.assets) {
    if (asset.type !== 'spritesheet' || asset.production_status !== 'ready') continue;
    if (!scene.textures.exists(asset.id) || scene.anims.exists(asset.id)) continue;
    scene.anims.create({
      key: asset.id,
      frames: scene.anims.generateFrameNumbers(asset.id, { start: 0, end: asset.frames - 1 }),
      frameRate: asset.fps ?? 10,
      repeat: asset.loop ? -1 : 0
    });
  }
}

// The caller supplies a VERIFIED fallback texture already loaded by the existing game.
export function addCharacterWithFallback(
  scene: Phaser.Scene, x: number, groundY: number, requestedKey: string, fallbackKey: string
): Phaser.GameObjects.Sprite {
  const key = scene.textures.exists(requestedKey) ? requestedKey : fallbackKey;
  if (!scene.textures.exists(key)) throw new Error(`No available character texture: ${key}`);
  const sprite = scene.add.sprite(x, groundY, key, 0);
  if (key === requestedKey) {
    sprite.setOrigin(0.5, 0.9375); // Samuca 128px: feet at local y=120.
    if (scene.anims.exists(requestedKey)) sprite.play(requestedKey);
  }
  return sprite;
}

// Hook visuals to existing combat events; never calculate damage from these frames.
export function playOnce(
  sprite: Phaser.GameObjects.Sprite, key: string, onVisualComplete?: () => void
): boolean {
  if (!sprite.scene.anims.exists(key)) return false;
  if (onVisualComplete) sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onVisualComplete);
  sprite.play(key);
  return true;
}

// Source rectangles are independent, so HP updates can crop the fill without redrawing art.
export function setHPFill(image: Phaser.GameObjects.Image, ratio: number): void {
  const clamped = Phaser.Math.Clamp(ratio, 0, 1);
  image.setOrigin(0, 0.5).setCrop(0, 0, Math.round(image.width * clamped), image.height);
  image.setVisible(clamped > 0);
}

// displayScale = CSS canvas width / logical canvas width. Keep UI hit zones >=44 CSS pixels.
// Space targets apart so expanded hit rectangles do not overlap.
export function addTouchTarget(sprite: Phaser.GameObjects.Sprite, displayScale: number): void {
  const side = Math.ceil(44 / Math.max(displayScale, 0.1));
  const w = Math.max(sprite.width, side / Math.max(Math.abs(sprite.scaleX), 0.01));
  const h = Math.max(sprite.height, side / Math.max(Math.abs(sprite.scaleY), 0.01));
  sprite.setInteractive(new Phaser.Geom.Rectangle((sprite.width-w)/2,(sprite.height-h)/2,w,h), Phaser.Geom.Rectangle.Contains);
}

// Phaser >=3.60 WebGL example for a scalable reusable panel:
export function addPanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number): Phaser.GameObjects.NineSlice {
  return scene.add.nineslice(x, y, 'ui.panel_memory', undefined, width, height, 12, 12, 12, 12);
}

// Illustration usage in an existing create() (not executed automatically):
// const groundY = scene.cache.json.get('forest.layers').combat_baseline_y;
// const samuca = addCharacterWithFallback(scene, 320, groundY, 'samuca.idle', verifiedOldHeroKey);
// samuca.setScale(2); // Choose based on the current game's approved proportions.
// Enemy art faces right: use enemy.setFlipX(true) when positioned to Samuca's right.
// VFX use setOrigin(0.5); give UI/world layers setOrigin(0).
// Prefer Phaser config pixelArt:true, antialias:false and roundPixels:true.
