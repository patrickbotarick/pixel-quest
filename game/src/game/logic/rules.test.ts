import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BattleManager, createTestBattle } from "./battleManager.ts";
import { ChallengeManager, challengePool } from "./challengeManager.ts";
import { attackDamage, helpedEnemyDamage } from "./damage.ts";
import { GameTimer } from "./gameTimer.ts";
import { living, nextAttackerIndex } from "./enemyController.ts";
import { gradeMath, makeMath, mathConfig } from "./mathChallenge.ts";
import {
  closeMismatch,
  createMemory,
  endPreview,
  memoryOutcome,
  memoryPairs,
  tapCard,
} from "./memoryChallenge.ts";
import { computeStars, recordDefeat, recordVictory } from "./progression.ts";
import { gradeReflex, markerAt, placeZone } from "./reflexChallenge.ts";
import { mulberry32 } from "./rng.ts";
import { defaultSave, loadSave, sanitizeSave, writeSave, type Kv } from "./saveManager.ts";
import { STAGES, getStage } from "./stages.ts";
import {
  boxesOverlap,
  cardBox,
  challengePanel,
  containsBox,
  fitFrame,
  mathControls,
  memoryGrid,
  memoryPlayfield,
  reflexControls,
  zoneBox,
} from "./panelLayout.ts";
import type { Fighter, StageDef } from "./types.ts";

const seen = { math: true, memory: true, reflex: true };

function memoryKv(): Kv {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

describe("dano", () => {
  it("calcula acerto, erro e tempo esgotado", () => {
    assert.equal(attackDamage("perfect"), 20);
    assert.equal(attackDamage("partial"), 5);
    assert.equal(attackDamage("miss"), 0);
  });

  it("reduz o dano inimigo só na tentativa com ajuda", () => {
    assert.equal(helpedEnemyDamage(10, false), 10);
    assert.equal(helpedEnemyDamage(10, true), 7);
    assert.equal(helpedEnemyDamage(9, true), 6);
    assert.equal(helpedEnemyDamage(5, true), 4);
    const helped = createTestBattle(getStage(5), { help: true, tutorials: seen });
    const normal = createTestBattle(getStage(5), { tutorials: seen });
    assert.equal(helped.enemies[0]?.damage, 6);
    assert.equal(normal.enemies[0]?.damage, 9);
  });
});

describe("matemática", () => {
  it("gera contas válidas, sem negativos e com opções distintas", () => {
    for (const stageId of [1, 2, 3, 4, 6, 8, 10]) {
      for (const help of [false, true]) {
        const cfg = mathConfig(stageId, help);
        for (let i = 0; i < 80; i++) {
          const problem = makeMath(stageId, mulberry32(stageId * 1000 + i + (help ? 500 : 0)), help);
          const result = problem.op === "+" ? problem.a + problem.b : problem.a - problem.b;
          assert.equal(result, problem.answer);
          assert.ok(problem.answer >= 0);
          assert.ok(problem.answer <= cfg.max);
          assert.ok(problem.a >= 0 && problem.b >= 0);
          if (stageId < 4) assert.equal(problem.op, "+");
          assert.equal(problem.options.length, 3);
          assert.equal(new Set(problem.options).size, 3);
          assert.ok(problem.options.includes(problem.answer));
          assert.ok(problem.options.every((n) => n >= 0));
          assert.equal(gradeMath(problem, problem.answer), "perfect");
          const wrong = problem.options.find((n) => n !== problem.answer)!;
          assert.equal(gradeMath(problem, wrong), "partial");
          assert.equal(gradeMath(problem, null), "miss");
        }
      }
    }
  });
});

describe("memória", () => {
  it("monta pares e não deixa abrir uma terceira carta", () => {
    assert.equal(memoryPairs(3), 2);
    assert.equal(memoryPairs(7), 3);
    const state = createMemory(3, mulberry32(4));
    assert.equal(state.cards.length, 6);
    const counts = new Map<string, number>();
    for (const card of state.cards) counts.set(card.symbol, (counts.get(card.symbol) ?? 0) + 1);
    for (const count of counts.values()) assert.equal(count, 2);

    const hidden = endPreview(state);
    assert.ok(hidden.cards.every((card) => !card.up));
    const first = tapCard(hidden, 0);
    assert.equal(first.event.type, "flip");
    const secondIndex = hidden.cards.findIndex((card, index) => index !== 0 && card.symbol !== hidden.cards[0]?.symbol);
    const second = tapCard(first.state, secondIndex);
    assert.equal(second.event.type, "mismatch");
    const third = tapCard(second.state, 1);
    assert.equal(third.event.type, "ignore");
    const closed = closeMismatch(second.state);
    assert.equal(closed.lock, false);
    assert.ok(closed.cards.every((card) => !card.up));
  });

  it("classifica resultado parcial e completo", () => {
    assert.equal(memoryOutcome(0, 2), "miss");
    assert.equal(memoryOutcome(1, 2), "partial");
    assert.equal(memoryOutcome(2, 2), "perfect");
    assert.equal(memoryOutcome(3, 3), "perfect");
  });
});

describe("reflexo", () => {
  it("move o marcador e classifica a zona", () => {
    assert.equal(markerAt(0, 2), 0);
    assert.equal(markerAt(1, 2), 0.5);
    assert.equal(markerAt(2, 2), 1);
    assert.equal(markerAt(3, 2), 0.5);
    assert.equal(markerAt(4, 2), 0);
    assert.equal(gradeReflex(null, 0.2, 0.3), "miss");
    assert.equal(gradeReflex(0.2, 0.2, 0.3), "perfect");
    assert.equal(gradeReflex(0.5, 0.2, 0.3), "perfect");
    assert.equal(gradeReflex(0.51, 0.2, 0.3), "partial");
    for (let i = 0; i < 30; i++) {
      const start = placeZone(0.22, mulberry32(i + 9));
      assert.ok(start >= 0.04 - 1e-9);
      assert.ok(start + 0.22 <= 0.96 + 1e-9);
    }
  });
});

describe("desafios e turnos", () => {
  it("não repete o mesmo desafio três vezes quando há alternativas", () => {
    assert.deepEqual(challengePool(1), ["math"]);
    assert.deepEqual(challengePool(3), ["math", "memory"]);
    assert.deepEqual(challengePool(5), ["math", "memory", "reflex"]);
    const onlyMath = new ChallengeManager(1, mulberry32(2));
    for (let i = 0; i < 12; i++) assert.equal(onlyMath.next(), "math");
    const mixed = new ChallengeManager(8, mulberry32(6));
    const history: string[] = [];
    for (let i = 0; i < 50; i++) history.push(mixed.next());
    assert.ok(history.includes("reflex"));
    assert.ok(history.includes("memory"));
    for (let i = 2; i < history.length; i++) {
      assert.ok(!(history[i] === history[i - 1] && history[i - 1] === history[i - 2]));
    }
  });

  it("ignora inimigo derrotado e alterna o contra-ataque", () => {
    const enemies: Fighter[] = [
      { id: "e0", kind: "bat", name: "A", hp: 10, maxHp: 10, damage: 1, boss: false },
      { id: "e1", kind: "bat", name: "B", hp: 0, maxHp: 10, damage: 1, boss: false },
      { id: "e2", kind: "spirit", name: "C", hp: 10, maxHp: 10, damage: 1, boss: false },
    ];
    assert.equal(living(enemies).length, 2);
    assert.equal(nextAttackerIndex(enemies, -1), 0);
    assert.equal(nextAttackerIndex(enemies, 0), 2);
    assert.equal(nextAttackerIndex(enemies, 2), 0);
  });

  it("pausa o cronômetro e recomeça o desafio do zero", () => {
    const timer = new GameTimer(10);
    timer.start();
    timer.tick(1);
    timer.pause();
    timer.tick(5);
    assert.equal(timer.elapsed, 1);
    timer.resume();
    timer.tick(1);
    assert.ok(Math.abs(timer.elapsed - 2) < 1e-9);

    const first = createTestBattle(getStage(1), { rng: mulberry32(3), tutorials: seen });
    first.finishIntro();
    first.tick(2);
    first.pause();
    assert.equal(first.tick(4), null);
    assert.ok(Math.abs(first.elapsed() - 2) < 1e-9);
    first.resume();
    first.answerMath(first.problem?.options.indexOf(first.problem.answer) ?? 0);
    assert.equal(first.phase, "feedback");
    assert.equal(first.answerMath(0), null);

    const restarted = createTestBattle(getStage(1), { rng: mulberry32(99), tutorials: seen });
    assert.equal(restarted.phase, "intro");
    assert.equal(restarted.attempts, 0);
    assert.equal(restarted.history.length, 0);
    assert.equal(restarted.heroHp, 100);
  });
});

describe("batalha", () => {
  it("resolve acerto, erro e tempo esgotado sem turno duplo", () => {
    const battle = createTestBattle(getStage(1), { rng: mulberry32(8), tutorials: seen });
    battle.finishIntro();
    assert.equal(battle.phase, "challenge");
    assert.equal(battle.timeLimit(), 10);
    assert.equal(battle.answerMath(99), null);
    const correct = battle.problem!.options.indexOf(battle.problem!.answer);
    const graded = battle.answerMath(correct);
    assert.equal(graded?.outcome, "perfect");
    assert.equal(battle.pending?.damage, 20);
    assert.equal(battle.tick(3), null);
    const hit = battle.applyPlayerAttack();
    assert.equal(hit?.targetHp, 20);
    assert.equal(battle.phase, "enemy_windup");
    assert.equal(battle.applyPlayerAttack(), null);
    const counter = battle.beginEnemyAttack();
    assert.equal(counter?.damage, 5);
    assert.equal(counter?.heroHp, 95);
    battle.finishEnemyAnimation();

    const wrong = battle.problem!.options.findIndex((n) => n !== battle.problem!.answer);
    battle.answerMath(wrong);
    assert.equal(battle.pending?.damage, 5);
    battle.applyPlayerAttack();
    battle.beginEnemyAttack();
    battle.finishEnemyAnimation();

    assert.equal(battle.tick(10), "timeout");
    assert.equal(battle.pending?.damage, 0);
    assert.equal(battle.pending?.text.startsWith("É "), true);
    const afterTimeout = battle.applyPlayerAttack();
    assert.equal(afterTimeout?.damage, 0);
  });

  it("seleciona alvo, remove derrotados e encerra em vitória", () => {
    const battle = createTestBattle(getStage(2), { rng: mulberry32(11), tutorials: seen });
    battle.finishIntro();
    assert.equal(battle.phase, "choose");
    assert.equal(battle.selectTarget("nope"), false);
    battle.enemies[1]!.hp = 0;
    assert.equal(battle.selectTarget("e1"), false);
    assert.equal(battle.selectTarget("e0"), true);
    const correct = battle.problem!.options.indexOf(battle.problem!.answer);
    battle.answerMath(correct);
    battle.applyPlayerAttack();
    assert.equal(battle.enemies[0]!.hp, 15);
    const counter = battle.beginEnemyAttack();
    assert.equal(counter?.enemyId, "e0");
    battle.finishEnemyAnimation();
    assert.equal(battle.phase, "challenge");
    battle.answerMath(battle.problem!.options.indexOf(battle.problem!.answer));
    const kill = battle.applyPlayerAttack();
    assert.equal(kill?.killed, true);
    assert.equal(battle.phase, "victory");
    assert.equal(battle.beginEnemyAttack(), null);
    assert.equal(battle.heroHp, 100 - 6);
  });

  it("entra em derrota e não continua os turnos", () => {
    const stage: StageDef = {
      id: 1,
      name: "Teste",
      region: "forest",
      biome: "forest",
      music: "forest",
      enemies: [{ kind: "slimeGreen", name: "Slime", hp: 80, damage: 60 }],
    };
    const battle = new BattleManager(stage, { rng: mulberry32(1), tutorials: seen });
    battle.finishIntro();
    battle.tick(11);
    battle.applyPlayerAttack();
    assert.equal(battle.enemies[0]!.hp, 80);
    battle.beginEnemyAttack();
    assert.equal(battle.heroHp, 40);
    battle.finishEnemyAnimation();
    battle.tick(11);
    battle.applyPlayerAttack();
    const last = battle.beginEnemyAttack();
    assert.equal(last?.defeated, true);
    assert.equal(battle.heroHp, 0);
    assert.equal(battle.phase, "defeat");
    battle.finishEnemyAnimation();
    assert.equal(battle.phase, "defeat");
    assert.equal(battle.answerMath(0), null);
  });

  it("ativa a segunda forma do dragão sem curar e sem aumentar o dano", () => {
    const battle = createTestBattle(getStage(10), { rng: mulberry32(4), tutorials: seen });
    battle.finishIntro();
    let triggered = false;
    let guard = 0;
    const phase = () => battle.phase;
    while (!triggered && guard < 24 && phase() !== "defeat" && phase() !== "victory") {
      guard += 1;
      if (phase() === "tutorial") battle.dismissTutorial();
      else if (phase() === "preview") battle.endPreview();
      else if (phase() === "choose") battle.selectTarget("e0");
      else if (phase() === "challenge") {
        if (battle.kind === "math" && battle.problem) {
          battle.answerMath(battle.problem.options.indexOf(battle.problem.answer));
        } else if (battle.kind === "reflex" && battle.reflex) {
          battle.hitReflex(battle.reflex.zoneStart + battle.reflex.zone / 2);
        } else if (battle.kind === "memory" && battle.memory) {
          while (phase() === "challenge" && battle.memory) {
            const cards = battle.memory.cards;
            const index = cards.findIndex((card) => !card.matched && !card.up);
            if (index < 0) break;
            const symbol = cards[index]!.symbol;
            const pair = cards.findIndex((card, cardIndex) => cardIndex !== index && !card.matched && card.symbol === symbol);
            battle.flipCard(index);
            battle.flipCard(pair);
          }
        }
        if (phase() === "feedback") {
          const hit = battle.applyPlayerAttack();
          if (hit?.phase2) triggered = true;
        }
        if (phase() === "enemy_windup") {
          const enemyHit = battle.beginEnemyAttack();
          assert.equal(enemyHit?.damage, 10);
          if (phase() === "after_enemy") battle.finishEnemyAnimation();
        }
      } else {
        break;
      }
    }
    assert.equal(triggered, true);
    assert.equal(battle.dragonPhase2, true);
    assert.ok((battle.enemies[0]?.hp ?? 0) > 0);
    assert.ok((battle.enemies[0]?.hp ?? 999) <= 90);
    assert.ok((battle.enemies[0]?.hp ?? 0) < 180);
  });

  it("dá dano parcial na memória incompleta e pleno quando fecha os pares", () => {
    const battleWithMemory = (seedStart: number) => {
      for (let seed = seedStart; seed < seedStart + 80; seed++) {
        const battle = createTestBattle(getStage(3), { rng: mulberry32(seed), tutorials: seen });
        battle.finishIntro();
        if (battle.phase === "choose") battle.selectTarget("e0");
        if (battle.kind === "memory" && battle.memory) {
          battle.endPreview();
          return battle;
        }
      }
      return null;
    };
    const matchOne = (battle: BattleManager) => {
      const cards = battle.memory!.cards;
      const index = cards.findIndex((card) => !card.matched && !card.up);
      const symbol = cards[index]!.symbol;
      const pair = cards.findIndex((card, cardIndex) => cardIndex !== index && !card.matched && card.symbol === symbol);
      battle.flipCard(index);
      return battle.flipCard(pair);
    };
    const partial = battleWithMemory(1);
    assert.ok(partial);
    assert.equal(matchOne(partial!).type, "match");
    assert.notEqual(partial!.phase, "feedback");
    assert.equal(partial!.tick(40), "timeout");
    assert.equal(partial!.pending?.outcome, "partial");
    assert.equal(partial!.pending?.damage, 5);

    const full = battleWithMemory(1);
    assert.ok(full);
    assert.equal(matchOne(full!).type, "match");
    const done = matchOne(full!);
    assert.equal(done.type, "match");
    assert.equal(full!.pending?.outcome, "perfect");
    assert.equal(full!.pending?.damage, 20);
  });

  it("classifica o reflexo dentro da batalha", () => {
    let battle: BattleManager | null = null;
    for (let seed = 1; seed < 40 && !battle; seed++) {
      const candidate = createTestBattle(getStage(6), { rng: mulberry32(seed), tutorials: seen });
      candidate.finishIntro();
      if (candidate.phase === "choose") candidate.selectTarget(candidate.enemies[0]!.id);
      if (candidate.kind === "reflex" && candidate.reflex) battle = candidate;
    }
    assert.ok(battle?.reflex);
    const inside = battle!.hitReflex(battle!.reflex!.zoneStart + battle!.reflex!.zone / 2);
    assert.equal(inside, "perfect");
    assert.equal(battle!.pending?.damage, 20);
  });
});

describe("progressão e salvamento", () => {
  it("abre a fase seguinte e preserva a melhor estrela", () => {
    assert.equal(STAGES.length, 10);
    assert.equal(getStage(1).enemies[0]?.hp, 40);
    assert.equal(getStage(5).enemies[0]?.hp, 140);
    assert.equal(getStage(5).enemies[0]?.boss, true);
    assert.equal(getStage(10).enemies[0]?.hp, 180);
    assert.equal(getStage(2).enemies.length, 2);
    assert.equal(getStage(4).enemies.length, 3);
    assert.equal(getStage(7).enemies.length, 3);
    assert.equal(computeStars(100, 4, 4), 3);
    assert.equal(computeStars(40, 3, 4), 3);
    assert.equal(computeStars(39, 4, 4), 2);
    assert.equal(computeStars(80, 1, 2), 2);
    assert.equal(computeStars(10, 0, 4), 1);

    let save = defaultSave();
    save = recordVictory(save, 1, 1);
    assert.equal(save.unlocked, 2);
    assert.equal(save.stars[1], 1);
    save = recordVictory(save, 1, 3);
    assert.equal(save.stars[1], 3);
    save = recordVictory(save, 1, 2);
    assert.equal(save.stars[1], 3);
    for (let stage = 2; stage <= 10; stage++) save = recordVictory(save, stage, 2);
    assert.equal(save.completed, true);
    assert.equal(save.unlocked, 10);
    assert.ok(save.cleared.slice(1).every(Boolean));
    save = recordDefeat(save, 4);
    save = recordDefeat(save, 4);
    assert.equal(save.losses[4], 2);
    save = recordVictory(save, 4, 1);
    assert.equal(save.losses[4], 0);
  });

  it("grava, recupera e descarta dados inválidos sem travar", () => {
    const kv = memoryKv();
    const save = recordVictory(defaultSave(), 3, 2);
    save.tutorials = { math: true, memory: true, reflex: false };
    save.settings = { music: false, sfx: true, volume: 0.4, reduceMotion: true };
    writeSave(save, kv);
    const loaded = loadSave(kv);
    assert.equal(loaded.unlocked, 4);
    assert.equal(loaded.stars[3], 2);
    assert.equal(loaded.tutorials.memory, true);
    assert.equal(loaded.settings.music, false);
    assert.equal(loaded.settings.reduceMotion, true);
    assert.equal(loaded.version, 1);

    kv.setItem("pixel-quest-save-v1", "{");
    kv.setItem("pixel-quest-save-backup", JSON.stringify({ ...defaultSave(), unlocked: 6, version: 1 }));
    assert.equal(loadSave(kv).unlocked, 6);

    kv.setItem("pixel-quest-save-v1", JSON.stringify({ version: 1, unlocked: "x", stars: "no", settings: { volume: 8 } }));
    kv.setItem("pixel-quest-save-backup", "{");
    const clean = loadSave(kv);
    assert.equal(clean.unlocked, 1);
    assert.equal(clean.settings.volume, 1);
    assert.deepEqual(sanitizeSave(null), defaultSave());
  });
});

const view = { x: 0, y: 0, w: 1280, h: 720 };

describe("layout dos desafios", () => {
  it("centraliza 4 e 6 cartas dentro do painel, sem sobreposição", () => {
    const panel = challengePanel();
    const field = memoryPlayfield(panel);
    assert.ok(containsBox(view, panel));
    assert.ok(containsBox(panel, field));
    for (const count of [4, 6]) {
      const grid = memoryGrid(count, field);
      assert.equal(grid.columns, count);
      assert.equal(grid.rows, 1);
      assert.equal(grid.positions.length, count);
      assert.ok(grid.cardW >= 48 && grid.cardH >= 56);
      const boxes = grid.positions.map((point) => cardBox(point, grid.cardW, grid.cardH));
      for (const box of boxes) assert.ok(containsBox(field, box), JSON.stringify(box));
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) assert.equal(boxesOverlap(boxes[i]!, boxes[j]!), false);
      }
      const minX = Math.min(...boxes.map((box) => box.x));
      const maxX = Math.max(...boxes.map((box) => box.x + box.w));
      const minY = Math.min(...boxes.map((box) => box.y));
      const maxY = Math.max(...boxes.map((box) => box.y + box.h));
      const gridW = maxX - minX;
      const gridH = maxY - minY;
      assert.ok(Math.abs(minX + gridW / 2 - (field.x + field.w / 2)) < 1);
      assert.ok(Math.abs(minY + gridH / 2 - (field.y + field.h / 2)) < 1);
    }
  });

  it("mantém matemática e reflexo inteiros no painel", () => {
    const panel = challengePanel();
    const math = mathControls(panel);
    assert.ok(containsBox(panel, { x: math.equation.x - 180, y: math.equation.y - 22, w: 360, h: 44 }));
    const buttons = math.buttons.map((button) => ({ x: button.x - button.w / 2, y: button.y - button.h / 2, w: button.w, h: button.h }));
    for (const button of buttons) assert.ok(containsBox(panel, button));
    for (let i = 0; i < buttons.length; i++) {
      for (let j = i + 1; j < buttons.length; j++) assert.equal(boxesOverlap(buttons[i]!, buttons[j]!), false);
    }
    const reflex = reflexControls(panel);
    assert.ok(containsBox(panel, reflex.track));
    assert.ok(containsBox(panel, reflex.hit));
    const markerH = 22 * 2.1;
    const markerW = 14 * 2.1;
    for (const at of [0, 1]) {
      const marker = {
        x: reflex.track.x + at * reflex.track.w - markerW / 2,
        y: reflex.markerY - markerH / 2,
        w: markerW,
        h: markerH,
      };
      assert.ok(containsBox(panel, marker));
    }
    for (const start of [0.04, 0.2, 0.66]) {
      assert.ok(containsBox(reflex.track, zoneBox(reflex.track, start, 0.3)));
    }
  });

  it("cabe nas viewports sem corte", () => {
    for (const [w, h] of [
      [1920, 1080],
      [1366, 768],
      [1280, 720],
      [844, 390],
      [667, 375],
    ]) {
      const frame = fitFrame(w, h);
      assert.equal(frame.fits, true);
      assert.ok(frame.x >= -0.01 && frame.y >= -0.01);
      const grid = memoryGrid(6, memoryPlayfield(challengePanel()));
      assert.ok(grid.cardW * frame.scale >= 24);
      assert.ok(grid.cardH * frame.scale >= 28);
    }
  });
});

describe("ciclo da memória", () => {
  function matchAll(battle: BattleManager): void {
    const symbols = (battle.memory?.cards ?? []).map((card) => card.symbol);
    const used = new Set<number>();
    for (let index = 0; index < symbols.length; index++) {
      if (used.has(index)) continue;
      const pair = symbols.findIndex((symbol, other) => other !== index && symbol === symbols[index] && !used.has(other));
      assert.ok(pair >= 0);
      assert.equal(battle.flipCard(index).type, "flip");
      assert.equal(battle.flipCard(pair).type, "match");
      used.add(index);
      used.add(pair);
    }
  }

  function nextTurn(battle: BattleManager): void {
    const phase = () => battle.phase;
    assert.equal(phase(), "feedback");
    const first = battle.applyPlayerAttack();
    assert.ok(first);
    assert.equal(battle.applyPlayerAttack(), null);
    if (phase() === "victory") return;
    assert.ok(battle.beginEnemyAttack());
    assert.equal(battle.beginEnemyAttack(), null);
    battle.finishEnemyAnimation();
  }

  function reach(battle: BattleManager, kind: "memory" | "reflex"): void {
    const phase = () => battle.phase;
    battle.finishIntro();
    for (let step = 0; step < 16; step++) {
      if (phase() === "choose") battle.selectTarget(battle.enemies.find((enemy) => enemy.hp > 0)!.id);
      if (phase() === "tutorial") battle.dismissTutorial();
      if (battle.kind === kind && (phase() === "preview" || phase() === "challenge")) return;
      if (phase() === "preview") battle.endPreview();
      if (phase() === "challenge" && battle.kind === "math" && battle.problem) {
        battle.answerMath(battle.problem.options.indexOf(battle.problem.answer));
      } else if (phase() === "challenge" && battle.kind === "memory") matchAll(battle);
      else if (phase() === "challenge" && battle.kind === "reflex" && battle.reflex) battle.hitReflex(battle.reflex.zoneStart);
      if (phase() !== "feedback") break;
      nextTurn(battle);
      if (phase() === "victory" || phase() === "defeat") break;
    }
    assert.equal(battle.kind, kind);
  }

  it("mostra a prévia, trava o par errado, completa e aplica 20 de dano", () => {
    const battle = createTestBattle(getStage(5), { rng: mulberry32(11), tutorials: seen });
    reach(battle, "memory");
    assert.equal(battle.phase, "preview");
    assert.equal(battle.memory?.cards.length, 4);
    assert.ok(battle.memory?.cards.every((card) => card.up));
    assert.equal(battle.flipCard(0).type, "ignore");
    assert.equal(battle.tick(40), null);
    assert.equal(battle.endPreview(), true);
    assert.equal(battle.phase, "challenge");
    assert.ok(battle.memory?.cards.every((card) => !card.up));
    assert.equal(battle.timeLimit(), 25);
    const symbols = battle.memory!.cards.map((card) => card.symbol);
    const wrong = symbols.findIndex((symbol, index) => index > 0 && symbol !== symbols[0]);
    assert.equal(battle.flipCard(0).type, "flip");
    assert.equal(battle.flipCard(wrong).type, "mismatch");
    assert.equal(battle.flipCard(0).type, "ignore");
    battle.closeMismatch();
    assert.ok(battle.memory?.cards.every((card) => !card.up));
    const before = battle.enemies[0]!.hp;
    matchAll(battle);
    assert.equal(battle.phase, "feedback");
    assert.equal(battle.pending?.damage, 20);
    assert.equal(battle.flipCard(0).type, "ignore");
    const hit = battle.applyPlayerAttack();
    assert.equal(hit?.damage, 20);
    assert.equal(battle.enemies[0]!.hp, before - 20);
    assert.equal(battle.applyPlayerAttack(), null);
  });

  it("encerra a memória por tempo, pausa o cronômetro e não duplica o turno", () => {
    const battle = createTestBattle(getStage(5), { rng: mulberry32(11), tutorials: seen });
    reach(battle, "memory");
    battle.endPreview();
    battle.pause();
    assert.equal(battle.tick(40), null);
    assert.equal(battle.phase, "challenge");
    battle.resume();
    assert.equal(battle.tick(40), "timeout");
    assert.equal(battle.phase, "feedback");
    assert.equal(battle.pending?.damage, 0);
    assert.equal(battle.tick(5), null);
    const hp = battle.enemies[0]!.hp;
    battle.applyPlayerAttack();
    assert.equal(battle.enemies[0]!.hp, hp);
  });
});
