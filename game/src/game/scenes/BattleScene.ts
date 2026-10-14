import Phaser from "phaser";
import { AnimationController } from "../anim/AnimationController.ts";
import { ASSET_BASE, biomeAssetId, cardFaceId, enemyAnimCandidates, fitCard, layerDepth, layerIds, layerPlacement, layersJsonPath, officialScale, parallaxAmplitude, pickAnim, stageAssetIds, type CatalogManifest } from "../art/officialCatalog.ts";
import { loadedIds, queueAssets, registerAnimations, releaseTextures } from "../art/phaserAssets.ts";
import { playEnemyPose, playHeroPose, playImpact } from "../art/playPose.ts";
import { COLOR, GROUND_Y } from "../GameConfig.ts";
import { BattleManager } from "../logic/battleManager.ts";
import { computeStars, recordDefeat, recordVictory } from "../logic/progression.ts";
import { markerAt } from "../logic/reflexChallenge.ts";
import {
  challengePanel,
  mathControls,
  memoryGrid,
  memoryPlayfield,
  reflexControls,
  trackSpan,
  zoneBox,
} from "../logic/panelLayout.ts";
import { loadSave, writeSave } from "../logic/saveManager.ts";
import { getStage } from "../logic/stages.ts";
import type { Biome, ChallengeKind, EnemyKind } from "../logic/types.ts";
import { addBackdrop, addStars, getAudio, makeMeter, pixelText, UiButton, uiText, type RatioMeter } from "../ui/widgets.ts";

interface BattleData {
  stageId?: number;
}

interface Actor {
  id: string;
  kind: EnemyKind;
  boss: boolean;
  maxHp: number;
  sprite: Phaser.GameObjects.Sprite;
  bar: RatioMeter;
  arrow: Phaser.GameObjects.Image;
  baseX: number;
  phase2: boolean;
}

interface CardView {
  root: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Image;
  front: Phaser.GameObjects.Container;
}

const TUTORIAL: Record<ChallengeKind, string> = {
  math: "TOQUE NA RESPOSTA CERTA",
  memory: "ACHE OS PARES IGUAIS",
  reflex: "TOQUE NA FAIXA VERDE",
};

function scaleFor(kind: EnemyKind, count: number): number {
  if (kind === "dragon") return 2.65;
  if (kind === "guardian") return 3.1;
  if (count >= 3) return 2.3;
  return count === 2 ? 2.65 : 3;
}

function slotX(count: number, index: number): number {
  if (count === 1) return 990;
  if (count === 2) return index === 0 ? 860 : 1120;
  return 790 + index * 175;
}

export class BattleScene extends Phaser.Scene {
  private stageId = 1;
  private manager!: BattleManager;
  private anim!: AnimationController;
  private reduce = false;
  private leaving = false;
  private resolving = false;
  private uiToken = 0;
  private lastSec = 99;
  private hero!: Phaser.GameObjects.Sprite;
  private heroBaseX = 250;
  private heroBar!: RatioMeter;
  private actors: Actor[] = [];
  private drifts: { image: Phaser.GameObjects.Image; baseX: number; factor: number }[] = [];
  private driftT = 0;
  private challengeRoot!: Phaser.GameObjects.Container;
  private feedback!: Phaser.GameObjects.Text;
  private timerFill!: Phaser.GameObjects.Rectangle;
  private timerBg!: Phaser.GameObjects.Rectangle;
  private timerImage?: Phaser.GameObjects.Image;
  private timerArt?: Phaser.GameObjects.NineSlice;
  private panelArt?: Phaser.GameObjects.NineSlice;
  private timerShown = false;
  private mathButtons: UiButton[] = [];
  private equation?: Phaser.GameObjects.Text;
  private cardViews: CardView[] = [];
  private marker?: Phaser.GameObjects.Image;
  private barX = 260;
  private barW = 760;

  constructor() {
    super("battle");
  }

  init(data: BattleData): void {
    this.stageId = Math.min(10, Math.max(1, data.stageId ?? 1));
    this.leaving = false;
    this.resolving = false;
    this.uiToken = 0;
    this.actors = [];
    this.drifts = [];
    this.driftT = 0;
    this.mathButtons = [];
    this.cardViews = [];
    this.marker = undefined;
  }

  preload(): void {
    const manifest = this.registry.get("pqManifest") as CatalogManifest | undefined;
    if (!manifest?.assets) return;
    queueAssets(this, manifest, ASSET_BASE, new Set(stageAssetIds(manifest, this.stageId)));
    const biome = getStage(this.stageId).biome;
    if (!this.cache.json.exists(`${biome}.layers`)) {
      this.load.json(`${biome}.layers`, `${ASSET_BASE}${layersJsonPath(biome)}`);
    }
  }

  create(): void {
    const stage = getStage(this.stageId);
    const save = loadSave();
    this.reduce = save.settings.reduceMotion;
    const help = save.helpArmed[this.stageId] === true;
    if (help) {
      save.helpArmed[this.stageId] = false;
      writeSave(save);
    }
    this.manager = new BattleManager(stage, { help, tutorials: { ...save.tutorials } });
    this.anim = new AnimationController(this);
    const manifest = this.registry.get("pqManifest") as CatalogManifest | undefined;
    if (manifest) registerAnimations(this, manifest);
    const officialWorld = this.mountWorld(stage.biome);
    if (!officialWorld) {
      addBackdrop(this, `bg_${stage.biome}`);
      this.add.rectangle(640, GROUND_Y + 16, 1280, 36, stage.region === "forest" ? 0x2a6b45 : 0x241c40).setDepth(2);
      for (let i = 0; i < 3; i++) {
        const cloud = this.add.image(200 + i * 380, 70 + i * 24, "cloud").setScale(2.2).setAlpha(0.8).setDepth(1);
        this.drifts.push({ image: cloud, baseX: cloud.x, factor: 0.4 });
      }
    }
    const title = this.add.text(28, 22, `${stage.id}  ${stage.name}`, pixelText(16)).setOrigin(0, 0).setDepth(30);
    title.setStroke("#182437", 5);
    this.add.text(28, 52, `${stage.id}/10`, uiText(18)).setOrigin(0, 0).setDepth(30).setStroke("#182437", 3);
    addStars(this, 640, 36, save.stars[stage.id] ?? 0, 1.6).forEach((star) => star.setDepth(30));
    if (help) this.add.text(640, 68, "AJUDINHA", uiText(16, "#F2C567")).setOrigin(0.5).setDepth(30);
    const pause = new UiButton(this, 1188, 40, 140, 52, "PAUSA", () => this.openPause(), { repeat: true, fontSize: 18 });
    pause.root.setDepth(40);

    const ready = loadedIds(this, manifest);
    const heroOfficial = ready.has("samuca.idle");
    this.hero = this.add
      .sprite(this.heroBaseX, GROUND_Y, heroOfficial ? "samuca.idle" : "hero_idle0", 0)
      .setOrigin(0.5, heroOfficial ? 0.9375 : 1)
      .setScale(heroOfficial ? officialScale("hero") : 3.3)
      .setDepth(10);
    playHeroPose(this, this.anim, this.hero, "idle", 2.3, true);
    this.heroBar = makeMeter(this, this.heroBaseX, this.meterY(this.hero), "HERÓI", "hero");
    this.heroBar.setRatio(1);

    stage.enemies.forEach((enemy, index) => {
      const idleId = pickAnim(enemyAnimCandidates(enemy.kind, "idle", false), ready);
      const official = Boolean(idleId);
      const scale = official ? officialScale(enemy.kind) : scaleFor(enemy.kind, stage.enemies.length);
      const x = slotX(stage.enemies.length, index);
      const key = official ? idleId! : enemy.kind === "dragon" ? "dragon_p1_idle0" : `${enemy.kind}_idle0`;
      const sprite = this.add.sprite(x, GROUND_Y, key, 0).setOrigin(0.5, official ? 0.9375 : 1).setScale(scale).setDepth(10);
      if (official) sprite.setFlipX(true);
      const hitW = sprite.width * 0.62;
      const hitH = sprite.height * 0.72;
      sprite.setInteractive(
        new Phaser.Geom.Rectangle((sprite.width - hitW) / 2, sprite.height * 0.18, hitW, hitH),
        Phaser.Geom.Rectangle.Contains,
      );
      if (sprite.input) sprite.input.cursor = "pointer";
      sprite.on("pointerdown", () => this.pickEnemy(`e${index}`));
      const barY = this.meterY(sprite);
      const bar = makeMeter(this, x, barY, enemy.name, enemy.boss ? "boss" : "enemy");
      const arrowKey = this.textures.exists("ui.target") ? "ui.target" : "marker";
      const arrow = this.add.image(x, barY - 28, arrowKey).setScale(arrowKey === "ui.target" ? 1.15 : 2).setDepth(33).setVisible(false);
      if (!this.reduce) this.tweens.add({ targets: arrow, y: arrow.y - 8, yoyo: true, repeat: -1, duration: 400 });
      playEnemyPose(this, this.anim, sprite, enemy.kind, "idle", false, 2.4, true);
      this.actors.push({ id: `e${index}`, kind: enemy.kind, boss: enemy.boss === true, maxHp: enemy.hp, sprite, bar, arrow, baseX: x, phase2: false });
    });

    const panel = challengePanel();
    const span = trackSpan(panel);
    this.barX = span.x;
    this.barW = span.w;
    if (this.textures.exists("ui.panel_battle")) {
      this.panelArt = this.add
        .nineslice(panel.x + panel.w / 2, panel.y + panel.h / 2, "ui.panel_battle", undefined, panel.w, panel.h, 12, 12, 12, 12)
        .setDepth(20);
    } else {
      this.add.rectangle(640, panel.y + panel.h / 2, panel.w, panel.h, COLOR.ink, 0.92).setStrokeStyle(4, COLOR.gold).setDepth(20);
    }
    this.timerBg = this.add.rectangle(this.barX, panel.y + 18, this.barW, 14, 0x121a28).setOrigin(0, 0.5).setStrokeStyle(2, COLOR.gold).setDepth(21);
    this.timerFill = this.add.rectangle(this.barX + 2, panel.y + 18, this.barW - 4, 8, COLOR.green).setOrigin(0, 0.5).setDepth(22);
    this.timerBg.setVisible(false);
    this.timerFill.setVisible(false);
    if (this.textures.exists("ui.timer_track") && this.textures.exists("ui.timer_fill")) {
      this.timerArt = this.add.nineslice(this.barX + this.barW / 2, panel.y + 18, "ui.timer_track", undefined, this.barW, 18, 6, 6, 6, 6).setDepth(21).setVisible(false);
      this.timerImage = this.add.image(this.barX + 8, panel.y + 18, "ui.timer_fill").setOrigin(0, 0.5).setDepth(22).setVisible(false);
      this.timerImage.setDisplaySize(this.barW - 16, 6);
    }
    this.feedback = this.add.text(640, panel.y + 44, "", uiText(22)).setOrigin(0.5).setDepth(23);
    this.feedback.setStroke("#182437", 4);
    this.challengeRoot = this.add.container(0, 0).setDepth(24);
    this.bindKeys();
    getAudio(this).playMusic(stage.music);
    this.playIntro(stage.enemies.some((enemy) => enemy.boss));
    this.events.once("shutdown", () => {
      this.leaving = true;
      this.input.keyboard?.off("keydown");
    });
  }

  notifyResume(): void {
    this.reduce = loadSave().settings.reduceMotion;
    this.manager.resume();
  }

  persistTutorials(): void {
    const save = loadSave();
    save.tutorials = { ...this.manager.tutorials };
    writeSave(save);
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(0.1, delta / 1000);
    if (!this.reduce) {
      this.driftT += dt;
      for (const layer of this.drifts) {
        const amp = parallaxAmplitude(layer.factor);
        layer.image.x = Math.round(layer.baseX + Math.sin(this.driftT * 0.35 + layer.factor * 5) * amp);
      }
    }
    if (this.manager.phase === "challenge" && this.manager.kind === "reflex" && this.marker && this.manager.reflex) {
      const marker = markerAt(this.manager.elapsed(), this.manager.reflex.period);
      this.marker.x = Math.round(this.barX + marker * this.barW);
    }
    if (this.manager.phase === "challenge") {
      const remain = this.manager.timeLimit() * this.manager.timerRatio();
      const sec = Math.ceil(remain);
      this.paintTimer(this.manager.timerRatio(), sec <= 3);
      if (sec <= 3 && sec > 0 && sec !== this.lastSec) {
        this.lastSec = sec;
        getAudio(this).sfx("tick");
      }
      if (this.manager.tick(dt) === "timeout") {
        getAudio(this).sfx("timeout");
        this.onResolved();
      }
    }
  }

  private playIntro(boss: boolean): void {
    const done = () => {
      this.hero.x = this.heroBaseX;
      for (const actor of this.actors) {
        actor.sprite.x = actor.baseX;
        actor.sprite.alpha = 1;
      }
      if (!boss) {
        this.manager.finishIntro();
        this.enterPlayerPhase();
        return;
      }
      this.feedback.setText(getStage(this.stageId).name.toUpperCase());
      getAudio(this).sfx("boss");
      this.time.delayedCall(this.reduce ? 250 : 800, () => {
        if (this.leaving) return;
        this.feedback.setText("");
        this.manager.finishIntro();
        this.enterPlayerPhase();
      });
    };
    if (this.reduce) {
      done();
      return;
    }
    this.hero.x = -40;
    this.tweens.add({ targets: this.hero, x: this.heroBaseX, duration: 380, ease: "Sine.out" });
    for (const actor of this.actors) {
      actor.sprite.x = actor.baseX + 80;
      actor.sprite.alpha = 0;
      this.tweens.add({ targets: actor.sprite, x: actor.baseX, alpha: 1, duration: 420, ease: "Sine.out" });
    }
    this.time.delayedCall(480, () => {
      if (!this.leaving) done();
    });
  }

  private enterPlayerPhase(): void {
    this.resolving = false;
    this.lastSec = 99;
    this.clearChallenge();
    const phase = this.manager.phase;
    const showTimer = phase === "challenge" || phase === "preview";
    this.timerShown = showTimer;
    this.timerBg.setVisible(showTimer && !this.timerImage);
    this.timerFill.setVisible(showTimer && !this.timerImage);
    this.timerArt?.setVisible(showTimer);
    this.timerImage?.setVisible(showTimer);
    this.paintTimer(1, false);
    if (phase === "choose") {
      this.dressPanel("battle");
      this.showChoose();
    } else if (phase === "tutorial") {
      this.dressPanel("battle");
      this.showTutorial();
    } else if (phase === "preview") {
      this.dressPanel("memory");
      this.showMemory();
    } else if (phase === "challenge") this.showActive();
    this.refreshArrows();
    this.publish();
  }

  private showChoose(): void {
    this.feedback.setText("TOQUE NO MONSTRO");
  }

  private showTutorial(): void {
    const kind = this.manager.kind ?? "math";
    this.feedback.setText(TUTORIAL[kind]);
    const button = new UiButton(this, 640, 630, 360, 80, "ENTENDI", () => {
      this.manager.dismissTutorial();
      this.persistTutorials();
      this.time.delayedCall(0, () => {
        if (!this.leaving) this.enterPlayerPhase();
      });
    });
    this.challengeRoot.add(button.root);
  }

  private showActive(): void {
    if (this.manager.kind === "math") {
      this.dressPanel("math");
      this.showMath();
    } else if (this.manager.kind === "memory") {
      this.dressPanel("memory");
      this.showMemory();
    } else if (this.manager.kind === "reflex") {
      this.dressPanel("reflex");
      this.showReflex();
    }
  }

  private showMath(): void {
    const problem = this.manager.problem;
    if (!problem) return;
    const layout = mathControls(challengePanel());
    this.equation = this.add.text(layout.equation.x, layout.equation.y, `${problem.a} ${problem.op} ${problem.b} = ?`, uiText(36)).setOrigin(0.5);
    this.equation.setStroke("#182437", 6);
    this.challengeRoot.add(this.equation);
    this.feedback.setText("QUANTO É?");
    this.mathButtons = problem.options.map((option, index) => {
      const slot = layout.buttons[index]!;
      const button = new UiButton(this, slot.x, slot.y, slot.w, slot.h, String(option), () => this.chooseMath(index), {
        hint: String(index + 1),
        fontSize: 40,
      });
      this.challengeRoot.add(button.root);
      return button;
    });
  }

  private showMemory(): void {
    const memory = this.manager.memory;
    if (!memory) return;
    const preview = this.manager.phase === "preview";
    this.feedback.setText(preview ? "OLHE BEM" : "ACHE OS PARES");
    const panel = challengePanel();
    const grid = memoryGrid(memory.cards.length, memoryPlayfield(panel));
    const iconScale = Math.min(grid.cardW, grid.cardH) / 42;
    const officialBack = this.textures.exists("ui.card_back");
    this.cardViews = memory.cards.map((card, index) => {
      const place = grid.positions[index]!;
      const root = this.add.container(place.x, place.y);
      const faceId = cardFaceId(card.symbol);
      const officialFace = this.textures.exists(faceId);
      const fitted = officialBack || officialFace ? fitCard(grid.cardW, grid.cardH) : { w: grid.cardW, h: grid.cardH };
      const back = this.add.image(0, 0, officialBack ? "ui.card_back" : "card_back").setDisplaySize(fitted.w, fitted.h);
      const front = this.add.container(0, 0);
      if (officialFace) {
        front.add(this.add.image(0, 0, faceId).setDisplaySize(fitted.w, fitted.h));
      } else {
        const face = this.add.rectangle(0, 0, grid.cardW, grid.cardH, 0xfff6e4).setStrokeStyle(4, COLOR.gold);
        const icon = this.add.image(0, 0, `icon_${card.symbol}`).setScale(iconScale);
        front.add([face, icon]);
      }
      root.add([back, front]);
      const open = preview || card.up;
      back.setVisible(!open);
      front.setVisible(open);
      root.setSize(grid.cardW, grid.cardH);
      root.setInteractive(
        new Phaser.Geom.Rectangle(-grid.cardW / 2, -grid.cardH / 2, grid.cardW, grid.cardH),
        Phaser.Geom.Rectangle.Contains,
      );
      root.on("pointerdown", () => this.onCard(index));
      this.challengeRoot.add(root);
      return { root, back, front };
    });
    if (preview) {
      this.uiLater(3000, () => {
        if (!this.manager.endPreview()) return;
        this.feedback.setText("ACHE OS PARES");
        for (const card of this.cardViews) this.flipView(card, false);
        this.publish();
      });
    }
  }

  private showReflex(): void {
    const reflex = this.manager.reflex;
    if (!reflex) return;
    this.feedback.setText("TOQUE NA FAIXA VERDE");
    const layout = reflexControls(challengePanel());
    this.barX = layout.track.x;
    this.barW = layout.track.w;
    const zone = zoneBox(layout.track, reflex.zoneStart, reflex.zone);
    const trackKey = this.textures.exists("ui.timer_track");
    const track = trackKey
      ? this.add.nineslice(layout.track.x + layout.track.w / 2, layout.track.y + layout.track.h / 2, "ui.timer_track", undefined, layout.track.w, layout.track.h, 6, 6, 6, 6)
      : this.add.rectangle(layout.track.x, layout.track.y + layout.track.h / 2, layout.track.w, layout.track.h, 0x121a28).setOrigin(0, 0.5).setStrokeStyle(3, COLOR.gold);
    const zoneMark = this.add.rectangle(zone.x, zone.y + zone.h / 2, zone.w, zone.h, COLOR.green, 0.9).setOrigin(0, 0.5);
    const markerKey = this.textures.exists("ui.target") ? "ui.target" : "marker";
    this.marker = this.add.image(layout.track.x, layout.markerY, markerKey).setScale(markerKey === "ui.target" ? 1.2 : 2.1);
    const hit = this.add.rectangle(layout.hit.x + layout.hit.w / 2, layout.hit.y + layout.hit.h / 2, layout.hit.w, layout.hit.h, 0xffffff, 0.001).setInteractive();
    hit.on("pointerdown", () => this.pressReflex());
    this.challengeRoot.add([track, zoneMark, this.marker, hit]);
  }

  private chooseMath(index: number): void {
    if (this.resolving || this.manager.phase !== "challenge") return;
    const result = this.manager.answerMath(index);
    if (!result || !this.manager.problem) return;
    this.mathButtons.forEach((button, buttonIndex) => {
      if (buttonIndex === result.correctIndex) button.setTone("good");
      else if (buttonIndex === index && result.outcome !== "perfect") button.setTone("bad");
    });
    this.equation?.setText(`${this.manager.problem.a} ${this.manager.problem.op} ${this.manager.problem.b} = ${this.manager.problem.answer}`);
    getAudio(this).sfx(result.outcome === "perfect" ? "correct" : "wrong");
    this.onResolved();
  }

  private onCard(index: number): void {
    if (this.resolving || this.manager.phase !== "challenge") return;
    const event = this.manager.flipCard(index);
    if (event.type === "ignore") return;
    getAudio(this).sfx("card");
    const view = this.cardViews[index];
    if (view) this.flipView(view, true);
    if (event.type === "match") {
      getAudio(this).sfx("pair");
      if (event.done) {
        getAudio(this).sfx("correct");
        this.onResolved();
      }
    }
    if (event.type === "mismatch") {
      getAudio(this).sfx("wrong");
      this.uiLater(560, () => {
        if (this.manager.phase !== "challenge") return;
        this.manager.closeMismatch();
        const first = this.cardViews[event.a];
        const second = this.cardViews[event.b];
        if (first) this.flipView(first, false);
        if (second) this.flipView(second, false);
      });
    }
  }

  private pressReflex(): void {
    if (this.resolving || this.manager.phase !== "challenge" || !this.manager.reflex) return;
    const pos = markerAt(this.manager.elapsed(), this.manager.reflex.period);
    const outcome = this.manager.hitReflex(pos);
    if (!outcome) return;
    getAudio(this).sfx(outcome === "perfect" ? "correct" : outcome === "partial" ? "wrong" : "timeout");
    this.onResolved();
  }

  private onResolved(): void {
    if (this.resolving || this.leaving) return;
    this.resolving = true;
    this.uiToken += 1;
    const pending = this.manager.pending;
    if (this.manager.kind === "math" && this.manager.problem) {
      const correct = this.manager.problem.options.indexOf(this.manager.problem.answer);
      this.mathButtons[correct]?.setTone("good");
      this.equation?.setText(`${this.manager.problem.a} ${this.manager.problem.op} ${this.manager.problem.b} = ${this.manager.problem.answer}`);
    }
    this.feedback.setText(pending?.text ?? "");
    this.refreshArrows();
    this.publish();
    this.flowLater(820, () => this.runAttack());
  }

  private runAttack(): void {
    const result = this.manager.applyPlayerAttack();
    if (!result) return;
    this.clearChallenge();
    this.feedback.setText("");
    const actor = this.actors.find((item) => item.id === result.targetId);
    const magic = result.outcome === "perfect";
    const miss = result.outcome === "miss";
    if (miss) {
      playHeroPose(this, this.anim, this.hero, "hurt", 8, false);
      getAudio(this).sfx("wrong");
    } else {
      const prepare = this.anims.exists("samuca.prepare");
      if (!this.reduce && prepare) {
        this.anim.play(this.hero, ["samuca.prepare"], 9, false);
        this.flowLater(150, () => {
          playHeroPose(this, this.anim, this.hero, magic ? "mag" : "atk", 12, false);
          if (actor) this.swingVfx(magic, actor);
        });
      } else {
        playHeroPose(this, this.anim, this.hero, magic ? "mag" : "atk", 12, false);
        if (actor) this.swingVfx(magic, actor);
      }
      getAudio(this).sfx(magic ? "magic" : "sword");
      if (!this.reduce) {
        const dest = Math.min((actor?.baseX ?? this.heroBaseX + 140) - 130, this.heroBaseX + 120);
        this.tweens.add({ targets: this.hero, x: dest, duration: 160, yoyo: true, hold: 180, ease: "Sine.out" });
      }
    }
    this.flowLater(this.reduce ? 90 : 280, () => {
      if (!actor) return;
      actor.bar.setRatio(result.targetHp / actor.maxHp);
      this.float(actor.sprite.x, this.meterY(actor.sprite) - 8, result.damage, result.damage >= 20);
      if (result.damage > 0) {
        getAudio(this).sfx("impact");
        actor.sprite.setTint(0xffd5d5);
        this.time.delayedCall(80, () => actor.sprite.clearTint());
        playImpact(this, magic ? "strong_attack" : "weak_attack", actor.sprite.x, actor.sprite.y - 70, actor.boss ? 2 : 1.6, this.reduce);
        if (magic) playImpact(this, "magic_impact", actor.sprite.x, actor.sprite.y - 80, 1.5, this.reduce);
      }
      if (result.killed) {
        playEnemyPose(this, this.anim, actor.sprite, actor.kind, "down", actor.phase2, 6, false);
        actor.sprite.disableInteractive();
        actor.arrow.setVisible(false);
        playImpact(this, "enemy_defeat", actor.sprite.x, actor.sprite.y - 60, 1.7, this.reduce);
        getAudio(this).sfx("down");
      } else if (result.damage > 0) {
        playEnemyPose(this, this.anim, actor.sprite, actor.kind, "hurt", actor.phase2, 8, false);
      }
      if (result.phase2) {
        actor.phase2 = true;
        this.feedback.setText("O DRAGÃO MUDOU!");
        getAudio(this).playMusic("dragon", true);
        playImpact(this, "dragon_special", actor.sprite.x, actor.sprite.y - 90, 2.2, this.reduce);
        if (this.anims.exists("shadow_dragon.phase_transition")) {
          this.anim.play(actor.sprite, ["shadow_dragon.phase_transition"], 8, false);
          actor.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (!actor.sprite.active || this.leaving) return;
            playEnemyPose(this, this.anim, actor.sprite, "dragon", "idle", true, 3, true);
          });
        } else {
          playEnemyPose(this, this.anim, actor.sprite, "dragon", "idle", true, 3, true);
        }
      }
    });
    this.flowLater(this.reduce ? 320 : 760, () => {
      this.hero.x = this.heroBaseX;
      if (this.manager.phase !== "victory") playHeroPose(this, this.anim, this.hero, "idle", 2.3, true);
      if (this.manager.phase === "victory") this.win();
      else this.enemyTurn();
    });
  }

  private swingVfx(magic: boolean, actor: Actor): void {
    playImpact(this, "sword_slash", (this.hero.x + actor.sprite.x) / 2, GROUND_Y - 90, magic ? 1.8 : 1.35, this.reduce);
  }

  private enemyTurn(): void {
    this.feedback.setText("CUIDADO!");
    const boss = this.actors.some((actor) => actor.boss && this.manager.enemies.some((enemy) => enemy.id === actor.id && enemy.hp > 0));
    this.flowLater(this.reduce ? 160 : boss ? 680 : 460, () => {
      const hit = this.manager.beginEnemyAttack();
      if (!hit) {
        if (this.manager.phase === "victory") this.win();
        return;
      }
      const actor = this.actors.find((item) => item.id === hit.enemyId);
      this.feedback.setText(hit.enemyName);
      if (actor) {
        playEnemyPose(this, this.anim, actor.sprite, actor.kind, "atk", actor.phase2, 8, false);
        if (!this.reduce) this.tweens.add({ targets: actor.sprite, x: actor.baseX - 46, duration: 140, yoyo: true });
        const vfx = actor.kind === "guardian" ? "golem_attack" : actor.kind === "dragon" ? (actor.phase2 ? "dragon_special" : "dragon_attack") : "";
        if (vfx) playImpact(this, vfx, actor.sprite.x - 40, GROUND_Y - 80, actor.boss ? 2 : 1.5, this.reduce);
      }
      getAudio(this).sfx(actor?.kind === "dragon" ? "magic" : "impact");
      this.flowLater(180, () => {
        this.heroBar.setRatio(hit.heroHp / this.manager.heroMax);
        this.float(this.hero.x, this.meterY(this.hero) - 8, hit.damage, false);
        playHeroPose(this, this.anim, this.hero, "hurt", 8, false);
        playImpact(this, "hero_damage", this.hero.x, this.hero.y - 80, 1.6, this.reduce);
        this.hero.setTint(0xffd0d0);
        this.time.delayedCall(90, () => this.hero.clearTint());
        getAudio(this).sfx("hurt");
        this.flowLater(240, () => {
          if (actor) playEnemyPose(this, this.anim, actor.sprite, actor.kind, "idle", actor.phase2, 2.4, true);
          if (hit.defeated) this.lose();
          else {
            playHeroPose(this, this.anim, this.hero, "idle", 2.3, true);
            this.manager.finishEnemyAnimation();
            this.feedback.setText("");
            this.enterPlayerPhase();
          }
        });
      });
    });
  }

  private win(): void {
    if (this.leaving) return;
    this.leaving = true;
    const stars = computeStars(this.manager.heroHp, this.manager.perfects, this.manager.attempts);
    let save = loadSave();
    save.tutorials = { ...this.manager.tutorials };
    save = recordVictory(save, this.stageId, stars);
    writeSave(save);
    playHeroPose(this, this.anim, this.hero, "win", 3, true);
    playImpact(this, "victory", this.hero.x, this.hero.y - 120, 1.8, this.reduce);
    this.feedback.setText("VITÓRIA!");
    this.time.delayedCall(this.reduce ? 220 : 620, () => {
      this.scene.start("victory", {
        stageId: this.stageId,
        stars,
        crystal: this.stageId === 5 || this.stageId === 10,
      });
    });
  }

  private lose(): void {
    if (this.leaving) return;
    this.leaving = true;
    let save = loadSave();
    save.tutorials = { ...this.manager.tutorials };
    save = recordDefeat(save, this.stageId);
    writeSave(save);
    playHeroPose(this, this.anim, this.hero, "lose", 2, false);
    this.time.delayedCall(this.reduce ? 220 : 520, () => {
      this.scene.start("gameover", { stageId: this.stageId, offerHelp: (save.losses[this.stageId] ?? 0) >= 2 });
    });
  }

  private pickEnemy(id: string): void {
    if (this.manager.phase !== "choose") return;
    if (!this.manager.selectTarget(id)) return;
    getAudio(this).sfx("confirm");
    this.enterPlayerPhase();
  }

  private refreshArrows(): void {
    const choosing = this.manager.phase === "choose";
    for (const actor of this.actors) {
      const enemy = this.manager.enemies.find((item) => item.id === actor.id);
      actor.arrow.setVisible(choosing && (enemy?.hp ?? 0) > 0);
    }
  }

  private meterY(sprite: Phaser.GameObjects.Sprite): number {
    const lift = sprite.originY > 0.9 ? sprite.displayHeight * 0.62 : sprite.displayHeight * sprite.originY;
    return Math.round(sprite.y - lift - 14);
  }

  private mountWorld(biome: Biome): boolean {
    const distant = `${biomeAssetId(biome)}.distant`;
    if (!this.textures.exists(distant)) return false;
    for (const other of ["forest", "ruins", "cave", "sanctuary"] as const) {
      if (other === biome) continue;
      releaseTextures(this, layerIds(other));
    }
    const meta = this.cache.json.exists(`${biome}.layers`)
      ? (this.cache.json.get(`${biome}.layers`) as { combat_baseline_y?: number; layers?: { id: string; scroll_factor: number }[] })
      : undefined;
    const baseline = meta?.combat_baseline_y ?? 460;
    const factors = new Map((meta?.layers ?? []).map((layer) => [layer.id, layer.scroll_factor]));
    for (const id of layerIds(biome)) {
      if (!this.textures.exists(id)) continue;
      const place = layerPlacement(baseline);
      const image = this.add.image(place.x, place.y, id).setOrigin(0.5, 0.5).setScale(place.scale).setDepth(layerDepth(id));
      if (id.endsWith(".particles")) image.setAlpha(this.reduce ? 0.35 : 0.85);
      this.drifts.push({ image, baseX: place.x, factor: factors.get(id) ?? 0.2 });
    }
    return true;
  }

  private dressPanel(kind: "battle" | "math" | "memory" | "reflex"): void {
    const key = `ui.panel_${kind}`;
    if (this.panelArt && this.textures.exists(key)) this.panelArt.setTexture(key);
  }

  private paintTimer(ratio: number, urgent: boolean): void {
    const clamped = Math.max(0, Math.min(1, ratio));
    this.timerFill.scaleX = Math.max(0.001, clamped);
    this.timerFill.setFillStyle(urgent ? COLOR.red : COLOR.green);
    if (!this.timerImage) return;
    this.timerImage.setCrop(0, 0, Math.max(1, Math.round(this.timerImage.width * clamped)), this.timerImage.height);
    this.timerImage.setTint(urgent ? 0xe66d67 : 0xffffff);
    this.timerImage.setVisible(this.timerShown && clamped > 0.01);
  }

  private float(x: number, y: number, damage: number, strong: boolean): void {
    const text = this.add
      .text(x, y, String(damage), uiText(strong ? 40 : 32, damage === 0 ? "#9BB0C9" : strong ? "#F2C567" : "#FFF2D6"))
      .setOrigin(0.5)
      .setDepth(80);
    text.setStroke("#182437", 5);
    this.tweens.add({
      targets: text,
      y: y - 42,
      alpha: 0,
      duration: this.reduce ? 180 : 640,
      onComplete: () => text.destroy(),
    });
  }

  private flipView(card: CardView, face: boolean): void {
    const finish = () => {
      card.back.setVisible(!face);
      card.front.setVisible(face);
      card.root.scaleX = 1;
    };
    if (this.reduce) {
      finish();
      return;
    }
    this.tweens.add({
      targets: card.root,
      scaleX: 0,
      duration: 110,
      onComplete: () => {
        card.back.setVisible(!face);
        card.front.setVisible(face);
        this.tweens.add({ targets: card.root, scaleX: 1, duration: 110 });
      },
    });
  }

  private clearChallenge(): void {
    this.uiToken += 1;
    this.challengeRoot.removeAll(true);
    this.mathButtons = [];
    this.cardViews = [];
    this.equation = undefined;
    this.marker = undefined;
  }

  private uiLater(ms: number, fn: () => void): void {
    const token = this.uiToken;
    this.time.delayedCall(ms, () => {
      if (token !== this.uiToken || this.leaving) return;
      fn();
    });
  }

  private flowLater(ms: number, fn: () => void): void {
    this.time.delayedCall(ms, () => {
      if (this.leaving) return;
      fn();
    });
  }

  private openPause(): void {
    if (this.leaving || this.scene.isActive("pause") || this.scene.isActive("settings")) return;
    this.manager.pause();
    this.scene.launch("pause", { stageId: this.stageId });
    this.scene.pause();
  }

  private bindKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.addCapture(["SPACE", "ESC", "ONE", "TWO", "THREE"]);
    keyboard.on("keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape") this.openPause();
      if (event.code === "Space") {
        event.preventDefault();
        this.pressReflex();
      }
      if (event.key === "1" || event.key === "2" || event.key === "3") this.chooseMath(Number(event.key) - 1);
    });
  }

  private banner(text: string): void {
    this.feedback.setText(text);
  }

  private publish(): void {
    const bridge = window as unknown as { __pq?: unknown; __pqReady?: boolean };
    bridge.__pqReady = true;
    bridge.__pq = {
      phase: this.manager.phase,
      stage: this.stageId,
      kind: this.manager.kind,
      equation: this.manager.problem ? `${this.manager.problem.a} ${this.manager.problem.op} ${this.manager.problem.b}` : "",
      options: this.manager.problem?.options ?? [],
      answer: this.manager.problem?.answer ?? null,
      hero: this.manager.heroHp,
      enemies: this.manager.enemies.map((enemy) => ({ id: enemy.id, hp: enemy.hp })),
    };
  }
}
