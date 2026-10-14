export class GameTimer {
  duration: number;
  elapsed = 0;
  remaining: number;
  running = false;
  done = false;

  constructor(duration: number) {
    this.duration = duration;
    this.remaining = duration;
  }

  start(): void {
    this.elapsed = 0;
    this.remaining = this.duration;
    this.running = true;
    this.done = false;
  }

  tick(dt: number): boolean {
    if (!this.running || this.done) return false;
    const step = Math.max(0, dt);
    this.elapsed += step;
    this.remaining -= step;
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.running = false;
      this.done = true;
      return true;
    }
    return false;
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    if (!this.done) this.running = true;
  }

  ratio(): number {
    if (this.duration <= 0) return 0;
    return Math.max(0, Math.min(1, this.remaining / this.duration));
  }
}
