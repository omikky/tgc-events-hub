import { describe, it, expect } from "vitest";
import { ScalpingStrategy } from "../src/strategies/ScalpingStrategy.js";
import type { Candle } from "../src/types.js";

function candle(close: number): Candle {
  return { timestamp: Date.now(), open: close, high: close, low: close, close, volume: 1 };
}

/** Build a price series from an array of closes. */
function series(closes: number[]): Candle[] {
  return closes.map(candle);
}

describe("ScalpingStrategy", () => {
  const strat = new ScalpingStrategy();

  it("holds while warming up", () => {
    const sig = strat.evaluate({ candles: series([1, 2, 3]), inPosition: false });
    expect(sig.action).toBe("hold");
  });

  it("enters long when RSI turns up from a pullback within an uptrend", () => {
    // Sustained uptrend keeps price above EMA50; a sharp pullback drags RSI into
    // pullback territory (~34), then the final bar ticks UP (RSI 34 -> 38),
    // confirming the dip is reversing -> entry.
    const up = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    const dipThenBounce = [216, 206, 197, 190, 184, 180, 177, 180];
    const sig = strat.evaluate({ candles: series([...up, ...dipThenBounce]), inPosition: false });
    expect(sig.action).toBe("enter_long");
  });

  it("does NOT enter while RSI is still falling (no falling-knife entry)", () => {
    const up = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    const stillFalling = [216, 206, 197, 190, 184, 180, 177];
    const sig = strat.evaluate({ candles: series([...up, ...stillFalling]), inPosition: false });
    expect(sig.action).toBe("hold");
  });

  it("holds (no entry) when the market is just trending up without a pullback", () => {
    const up = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    const sig = strat.evaluate({ candles: series(up), inPosition: false });
    expect(sig.action).toBe("hold");
  });

  it("exits an open position when RSI becomes overbought", () => {
    // A strong, sustained climb drives RSI well above the overbought threshold.
    const up = Array.from({ length: 120 }, (_, i) => 100 + i * 2);
    const sig = strat.evaluate({ candles: series(up), inPosition: true, entryPrice: 150 });
    expect(sig.action).toBe("exit");
    expect(sig.reason).toMatch(/overbought/);
  });

  it("holds a position when not overbought (lets stop-loss / take-profit work)", () => {
    // Mild drift keeps RSI mid-range -> no soft exit; RiskManager owns SL/TP.
    const mild = Array.from({ length: 120 }, (_, i) => 100 + Math.sin(i / 4) * 2 + i * 0.05);
    const sig = strat.evaluate({ candles: series(mild), inPosition: true, entryPrice: 105 });
    expect(sig.action).toBe("hold");
  });
});
