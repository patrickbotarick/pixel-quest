import type { Fighter } from "./types.ts";
import { nextAttackerIndex } from "./enemyController.ts";

export class TurnManager {
  private cursor = -1;

  reset(): void {
    this.cursor = -1;
  }

  nextEnemy(enemies: readonly Fighter[]): number {
    const index = nextAttackerIndex(enemies, this.cursor);
    if (index >= 0) this.cursor = index;
    return index;
  }
}
