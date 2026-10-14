import { ChallengeManager } from "./challengeManager.ts";
import { attackDamage } from "./damage.ts";
import { helpedEnemyDamage } from "./damage.ts";
import { GameTimer } from "./gameTimer.ts";
import { gradeMath, makeMath, type MathProblem } from "./mathChallenge.ts";
import {
  closeMismatch,
  createMemory,
  endPreview,
  memoryOutcome,
  memoryPairs,
  memoryTime,
  tapCard,
  type MemoryEvent,
  type MemoryState,
} from "./memoryChallenge.ts";
import { gradeReflex, makeReflex, type ReflexConfig } from "./reflexChallenge.ts";
import type { Rng } from "./rng.ts";
import { getStage } from "./stages.ts";
import { TurnManager } from "./turnManager.ts";
import {
  HERO_MAX_HP,
  type ChallengeKind,
  type Fighter,
  type Outcome,
  type StageDef,
  type Tutorials,
} from "./types.ts";

export type BattlePhase =
  | "intro"
  | "choose"
  | "tutorial"
  | "preview"
  | "challenge"
  | "feedback"
  | "enemy_windup"
  | "after_enemy"
  | "victory"
  | "defeat";

export interface PendingHit {
  outcome: Outcome;
  damage: number;
  targetId: string;
  text: string;
  answer: number | null;
}

export interface PlayerHitResult extends PendingHit {
  targetHp: number;
  killed: boolean;
  phase2: boolean;
  allDead: boolean;
  name: string;
}

export interface EnemyHitResult {
  enemyId: string;
  enemyName: string;
  enemyKind: Fighter["kind"];
  damage: number;
  heroHp: number;
  defeated: boolean;
  boss: boolean;
}

export interface BattleOptions {
  help?: boolean;
  rng?: Rng;
  tutorials?: Tutorials;
}

const seenAll: Tutorials = { math: true, memory: true, reflex: true };

function feedbackText(kind: ChallengeKind, outcome: Outcome, answer: number | null): string {
  if (kind === "math" && outcome !== "perfect" && answer !== null) return `É ${answer}`;
  if (outcome === "perfect") return "BOA!";
  if (outcome === "partial") return "QUASE!";
  return "TEMPO!";
}

export class BattleManager {
  readonly stage: StageDef;
  readonly help: boolean;
  readonly enemies: Fighter[];
  heroHp = HERO_MAX_HP;
  readonly heroMax = HERO_MAX_HP;
  phase: BattlePhase = "intro";
  tutorials: Tutorials;
  attempts = 0;
  perfects = 0;
  dragonPhase2 = false;
  selectedId: string | null = null;
  kind: ChallengeKind | null = null;
  problem: MathProblem | null = null;
  memory: MemoryState | null = null;
  reflex: ReflexConfig | null = null;
  pending: PendingHit | null = null;

  private readonly rng: Rng;
  private readonly challenges: ChallengeManager;
  private readonly turns = new TurnManager();
  private readonly timer = new GameTimer(10);
  private timersPaused = false;
  private resolved = false;

  constructor(stage: StageDef, options: BattleOptions = {}) {
    this.stage = stage;
    this.help = options.help === true;
    this.rng = options.rng ?? Math.random;
    this.tutorials = { ...(options.tutorials ?? { math: false, memory: false, reflex: false }) };
    this.challenges = new ChallengeManager(stage.id, this.rng);
    this.enemies = stage.enemies.map((enemy, index) => ({
      id: `e${index}`,
      kind: enemy.kind,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.hp,
      damage: helpedEnemyDamage(enemy.damage, this.help),
      boss: enemy.boss === true,
    }));
  }

  get history(): readonly ChallengeKind[] {
    return this.challenges.history;
  }

  elapsed(): number {
    return this.timer.elapsed;
  }

  timerRatio(): number {
    return this.timer.ratio();
  }

  timeLimit(): number {
    return this.timer.duration;
  }

  finishIntro(): void {
    if (this.phase !== "intro") return;
    this.openPlayerTurn();
  }

  selectTarget(id: string): boolean {
    if (this.phase !== "choose") return false;
    const enemy = this.enemies.find((item) => item.id === id && item.hp > 0);
    if (!enemy) return false;
    this.selectedId = id;
    this.openChallenge();
    return true;
  }

  dismissTutorial(): boolean {
    if (this.phase !== "tutorial" || !this.kind) return false;
    this.tutorials[this.kind] = true;
    this.activatePrepared();
    return true;
  }

  endPreview(): boolean {
    if (this.phase !== "preview" || !this.memory) return false;
    this.memory = endPreview(this.memory);
    this.phase = "challenge";
    this.timer.start();
    return true;
  }

  tick(dt: number): "timeout" | null {
    if (this.timersPaused || this.phase !== "challenge") return null;
    if (!this.timer.tick(dt)) return null;
    this.resolveTimeout();
    return "timeout";
  }

  pause(): void {
    this.timersPaused = true;
    this.timer.pause();
  }

  resume(): void {
    this.timersPaused = false;
    if (this.phase === "challenge") this.timer.resume();
  }

  answerMath(index: number | null): { correctIndex: number; outcome: Outcome } | null {
    if (this.phase !== "challenge" || this.kind !== "math" || !this.problem) return null;
    const correctIndex = this.problem.options.indexOf(this.problem.answer);
    if (index === null) {
      this.resolve("miss", this.problem.answer);
      return { correctIndex, outcome: "miss" };
    }
    const choice = this.problem.options[index];
    if (choice === undefined) return null;
    const outcome = gradeMath(this.problem, choice);
    this.resolve(outcome, this.problem.answer);
    return { correctIndex, outcome };
  }

  flipCard(index: number): MemoryEvent {
    if (this.phase !== "challenge" || this.kind !== "memory" || !this.memory) return { type: "ignore" };
    const result = tapCard(this.memory, index);
    this.memory = result.state;
    if (result.event.type === "match" && result.event.done) {
      this.resolve(memoryOutcome(this.memory.found, this.memory.pairs), null);
    }
    return result.event;
  }

  closeMismatch(): void {
    if (!this.memory) return;
    this.memory = closeMismatch(this.memory);
  }

  hitReflex(pos: number | null): Outcome | null {
    if (this.phase !== "challenge" || this.kind !== "reflex" || !this.reflex) return null;
    const outcome = gradeReflex(pos, this.reflex.zoneStart, this.reflex.zone);
    this.resolve(outcome, null);
    return outcome;
  }

  applyPlayerAttack(): PlayerHitResult | null {
    if (this.phase !== "feedback" || !this.pending) return null;
    const pending = this.pending;
    this.pending = null;
    let enemy = this.enemies.find((item) => item.id === pending.targetId && item.hp > 0);
    enemy ??= this.enemies.find((item) => item.hp > 0);
    if (!enemy) {
      this.phase = "victory";
      return null;
    }
    const before = enemy.hp;
    enemy.hp = Math.max(0, enemy.hp - pending.damage);
    let phase2 = false;
    if (
      enemy.kind === "dragon" &&
      !this.dragonPhase2 &&
      enemy.hp > 0 &&
      before > enemy.maxHp * 0.5 &&
      enemy.hp <= enemy.maxHp * 0.5
    ) {
      this.dragonPhase2 = true;
      phase2 = true;
    }
    const allDead = this.enemies.every((item) => item.hp <= 0);
    this.phase = allDead ? "victory" : "enemy_windup";
    return {
      ...pending,
      targetId: enemy.id,
      targetHp: enemy.hp,
      killed: enemy.hp <= 0,
      phase2,
      allDead,
      name: enemy.name,
    };
  }

  beginEnemyAttack(): EnemyHitResult | null {
    if (this.phase !== "enemy_windup") return null;
    const index = this.turns.nextEnemy(this.enemies);
    const enemy = index >= 0 ? this.enemies[index] : undefined;
    if (!enemy) {
      this.phase = "victory";
      return null;
    }
    this.heroHp = Math.max(0, this.heroHp - enemy.damage);
    const defeated = this.heroHp <= 0;
    this.phase = defeated ? "defeat" : "after_enemy";
    return {
      enemyId: enemy.id,
      enemyName: enemy.name,
      enemyKind: enemy.kind,
      damage: enemy.damage,
      heroHp: this.heroHp,
      defeated,
      boss: enemy.boss,
    };
  }

  finishEnemyAnimation(): void {
    if (this.phase !== "after_enemy") return;
    this.openPlayerTurn();
  }

  private openPlayerTurn(): void {
    if (this.phase === "victory" || this.phase === "defeat") return;
    this.pending = null;
    this.resolved = false;
    const alive = this.enemies.filter((enemy) => enemy.hp > 0);
    if (alive.length === 0) {
      this.phase = "victory";
      return;
    }
    if (alive.length > 1) {
      this.selectedId = null;
      this.phase = "choose";
      return;
    }
    this.selectedId = alive[0]!.id;
    this.openChallenge();
  }

  private openChallenge(): void {
    this.kind = this.challenges.next();
    this.resolved = false;
    this.prepare(this.kind);
    if (!this.tutorials[this.kind]) {
      this.phase = "tutorial";
      return;
    }
    this.activatePrepared();
  }

  private prepare(kind: ChallengeKind): void {
    this.problem = null;
    this.memory = null;
    this.reflex = null;
    if (kind === "math") this.problem = makeMath(this.stage.id, this.rng, this.help);
    if (kind === "memory") this.memory = createMemory(memoryPairs(this.stage.id), this.rng);
    if (kind === "reflex") this.reflex = makeReflex(this.stage.id, this.rng, this.help);
  }

  private activatePrepared(): void {
    if (!this.kind) return;
    if (this.kind === "memory") {
      this.phase = "preview";
      this.timer.duration = memoryTime(this.stage.id, this.help);
      return;
    }
    const duration = this.kind === "math" ? (this.problem ? timeOfMath(this.stage.id, this.help) : 10) : (this.reflex?.time ?? 10);
    this.timer.duration = duration;
    this.phase = "challenge";
    this.timer.start();
  }

  private resolve(outcome: Outcome, answer: number | null): void {
    if (this.resolved || this.phase !== "challenge" || !this.kind) return;
    this.resolved = true;
    this.timer.pause();
    this.attempts += 1;
    if (outcome === "perfect") this.perfects += 1;
    const target =
      this.enemies.find((enemy) => enemy.id === this.selectedId && enemy.hp > 0) ??
      this.enemies.find((enemy) => enemy.hp > 0);
    if (!target) {
      this.phase = "victory";
      return;
    }
    this.pending = {
      outcome,
      damage: attackDamage(outcome),
      targetId: target.id,
      text: feedbackText(this.kind, outcome, answer),
      answer,
    };
    this.phase = "feedback";
  }

  private resolveTimeout(): void {
    if (!this.kind) return;
    if (this.kind === "math") {
      this.resolve("miss", this.problem?.answer ?? null);
      return;
    }
    if (this.kind === "memory" && this.memory) {
      this.resolve(memoryOutcome(this.memory.found, this.memory.pairs), null);
      return;
    }
    this.resolve("miss", null);
  }
}

function timeOfMath(stageId: number, help: boolean): number {
  return help ? 13 : 10;
}

export function createBattle(stageId: number, options: BattleOptions = {}): BattleManager {
  return new BattleManager(getStage(stageId), options);
}

export function createTestBattle(stage: StageDef, options: BattleOptions = {}): BattleManager {
  return new BattleManager(stage, {
    ...options,
    tutorials: options.tutorials ?? seenAll,
  });
}
