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
