import type { Signal } from "../types.js";
import { ema, rsiLastTwo } from "../utils/indicators.js";
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
  // 42, not a deep-oversold 30/35: in an uptrend a *pullback* rarely drives RSI
  // to extreme-oversold without also breaking below the trend EMA, so a stricter
  // value almost never triggers. ~40-45 is the usual range for this style.
  rsiOversold: 42,
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
    const rsiPair = rsiLastTwo(candles, this.p.rsiPeriod);
    const price = candles.at(-1)?.close;

    if (trend === null || rsiPair === null || price === undefined) {
      return { action: "hold", reason: "warming up (not enough candles)" };
    }

    const [prevR, r] = rsiPair;
    const uptrend = price > trend;

    if (!inPosition) {
      // Enter when RSI dipped into pullback territory and is now turning back UP
      // (confirmation the dip is reversing), while the trend is still up. Waiting
      // for the up-tick avoids buying a falling knife that runs straight to the
      // stop-loss.
      if (uptrend && prevR <= this.p.rsiOversold && r > prevR) {
        return {
          action: "enter_long",
          reason: `uptrend + RSI turning up from pullback (${prevR.toFixed(1)} -> ${r.toFixed(1)})`,
        };
      }
      return {
        action: "hold",
        reason: `no entry (uptrend=${uptrend}, rsi ${prevR.toFixed(1)}->${r.toFixed(1)})`,
      };
    }

    // In a position: take profit early when momentum is exhausted (RSI
    // overbought). Downside and final upside are handled by the RiskManager's
    // hard stop-loss / take-profit. We deliberately do NOT exit just because
    // price dips below the trend EMA: entries happen right at that line, so such
    // an exit fires on the next tick and churns fees (whipsaw) — the stop-loss
    // already caps the downside.
    if (r >= this.p.rsiOverbought) {
      return { action: "exit", reason: `RSI ${r.toFixed(1)} >= ${this.p.rsiOverbought} (overbought)` };
    }
    return { action: "hold", reason: `holding (rsi=${r.toFixed(1)}, uptrend=${uptrend})` };
  }
}
