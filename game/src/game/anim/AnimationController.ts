import Phaser from "phaser";

type Playable = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;

export class AnimationController {
  constructor(private readonly scene: Phaser.Scene) {}

  play(sprite: Playable, frames: string[], fps: number, repeat: boolean): void {
    const previous = sprite.getData("animEv") as Phaser.Time.TimerEvent | undefined;
    previous?.remove(false);
    sprite.setData("animEv", null);
    const animated = sprite as Phaser.GameObjects.Sprite;
    const official = frames.length === 1 && !!frames[0] && this.scene.anims.exists(frames[0]);
    if (official && animated.anims) {
      animated.play(frames[0]!);
      return;
    }
    if (animated.anims?.isPlaying) animated.anims.stop();
    if (frames.length === 0) return;
    sprite.setTexture(frames[0]!);
    if (frames.length === 1 || fps <= 0) return;
    let index = 0;
    const event = this.scene.time.addEvent({
      delay: Math.max(50, 1000 / fps),
      loop: true,
      callback: () => {
        if (!sprite.active) {
          event.remove(false);
          return;
        }
        index += 1;
        if (index >= frames.length) {
          if (!repeat) {
            event.remove(false);
            sprite.setData("animEv", null);
            return;
          }
          index = 0;
        }
        sprite.setTexture(frames[index]!);
      },
    });
    sprite.setData("animEv", event);
  }
}
