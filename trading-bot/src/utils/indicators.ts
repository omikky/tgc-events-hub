import { EMA, RSI, ATR } from "technicalindicators";
import type { Candle } from "../types.js";

/** Exponential moving average over closes. Returns the latest value, or null. */
export function ema(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;
  const values = EMA.calculate({ period, values: candles.map((c) => c.close) });
  return values.at(-1) ?? null;
}

/** Relative Strength Index over closes. Returns the latest value, or null. */
export function rsi(candles: Candle[], period: number): number | null {
  if (candles.length < period + 1) return null;
  const values = RSI.calculate({ period, values: candles.map((c) => c.close) });
  return values.at(-1) ?? null;
}

/** The latest two RSI values [previous, current], or null if not enough data.
 *  Lets a strategy detect RSI turning back up from oversold. */
export function rsiLastTwo(candles: Candle[], period: number): [number, number] | null {
  if (candles.length < period + 2) return null;
  const values = RSI.calculate({ period, values: candles.map((c) => c.close) });
  const prev = values.at(-2);
  const curr = values.at(-1);
  if (prev === undefined || curr === undefined) return null;
  return [prev, curr];
}

/** Average True Range — a volatility measure used for adaptive stops. */
export function atr(candles: Candle[], period: number): number | null {
  if (candles.length < period + 1) return null;
  const values = ATR.calculate({
    period,
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
  });
  return values.at(-1) ?? null;
}
