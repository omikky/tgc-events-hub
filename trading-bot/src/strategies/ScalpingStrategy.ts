import type { Signal } from "../types.js";
import { ema, rsi } from "../utils/indicators.js";
import type { Strategy, StrategyContext } from "./Strategy.js";

export interface ScalpingParams {
  /** Trend filter EMA. Slow on purpose so a short pullback doesn't flip it. */
  trendEma: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
}

const DEFAULTS: ScalpingParams = {
  trendEma: 50,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 35,
};

/**
 * A long-only "buy the dip in an uptrend" scalper.
 *
 * Trend and entry-timing are deliberately measured on DIFFERENT horizons. If we
 * used a fast EMA pair for the trend filter, it would flip bearish on the very
 * same dip that pushes RSI oversold, so the two conditions could never line up.
 * Instead:
 *
 *   TREND  = price above a slow EMA(50)  -> the bigger move is still up.
 *   ENTRY  = RSI(14) <= oversold         -> a short-term pullback to buy into.
 *
 *   ENTER when (trend up) AND (RSI oversold).
 *   EXIT  when RSI overbought (soft take-profit) OR price closes back below the
 *         trend EMA (the uptrend has broken).
 *
 * Hard stop-loss / take-profit prices are enforced by the RiskManager, so this
 * only expresses the "soft" view. Tune params or swap the whole strategy out —
 * the engine only depends on the Strategy interface.
 */
export class ScalpingStrategy implements Strategy {
  readonly name = "scalping";
  readonly warmupCandles: number;
  private readonly p: ScalpingParams;

  constructor(params: Partial<ScalpingParams> = {}) {
    this.p = { ...DEFAULTS, ...params };
    this.warmupCandles = this.p.trendEma + this.p.rsiPeriod + 5;
  }

  evaluate(ctx: StrategyContext): Signal {
    const { candles, inPosition } = ctx;

    const trend = ema(candles, this.p.trendEma);
    const r = rsi(candles, this.p.rsiPeriod);
    const price = candles.at(-1)?.close;

    if (trend === null || r === null || price === undefined) {
      return { action: "hold", reason: "warming up (not enough candles)" };
    }

    const uptrend = price > trend;

    if (!inPosition) {
      if (uptrend && r <= this.p.rsiOversold) {
        return {
          action: "enter_long",
          reason: `uptrend (price>${this.p.trendEma}EMA) + RSI ${r.toFixed(1)} <= ${this.p.rsiOversold}`,
        };
      }
      return { action: "hold", reason: `no entry (uptrend=${uptrend}, rsi=${r.toFixed(1)})` };
    }

    // In a position: take soft profit / cut if the uptrend breaks.
    if (r >= this.p.rsiOverbought) {
      return { action: "exit", reason: `RSI ${r.toFixed(1)} >= ${this.p.rsiOverbought} (overbought)` };
    }
    if (!uptrend) {
      return { action: "exit", reason: `price closed below ${this.p.trendEma}EMA (trend broken)` };
    }
    return { action: "hold", reason: `holding (rsi=${r.toFixed(1)})` };
  }
}
