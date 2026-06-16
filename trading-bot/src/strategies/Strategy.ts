import type { Candle, Signal } from "../types.js";

export interface StrategyContext {
  /** Recent candles, oldest first. */
  candles: Candle[];
  /** True if the bot currently holds an open position for this symbol. */
  inPosition: boolean;
  /** Entry price of the open position, if any. */
  entryPrice?: number;
}

/**
 * A strategy is a pure decision function: given market context, return a
 * signal. It must not place orders or touch balances itself — that keeps
 * strategies testable and swappable. Implement this interface to add your own.
 */
export interface Strategy {
  readonly name: string;
  /** Minimum candles needed before the strategy can produce a real signal. */
  readonly warmupCandles: number;
  evaluate(ctx: StrategyContext): Signal;
}
