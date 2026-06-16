import type { Strategy } from "./Strategy.js";
import { ScalpingStrategy } from "./ScalpingStrategy.js";

/** Registry of available strategies. Add new ones here. */
export function createStrategy(name: string): Strategy {
  switch (name) {
    case "scalping":
      return new ScalpingStrategy();
    default:
      throw new Error(`Unknown strategy "${name}". Available: scalping`);
  }
}

export type { Strategy, StrategyContext } from "./Strategy.js";
