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

  it("enters long on a dip within an uptrend", () => {
    // A sustained uptrend keeps price above the EMA50 trend filter, then a sharp
    // short pullback drags RSI(14) into oversold territory (~34) while price is
    // still above the trend line -> "buy the dip in an uptrend".
    const up = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    const dip = [216, 206, 197, 190, 184, 180, 177];
    const sig = strat.evaluate({ candles: series([...up, ...dip]), inPosition: false });
    expect(sig.action).toBe("enter_long");
  });

  it("holds (no entry) when the market is just trending up without a pullback", () => {
    const up = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    const sig = strat.evaluate({ candles: series(up), inPosition: false });
    expect(sig.action).toBe("hold");
  });

  it("exits an open position when price falls below the trend EMA", () => {
    const down = Array.from({ length: 70 }, (_, i) => 200 - i * 2);
    const sig = strat.evaluate({
      candles: series(down),
      inPosition: true,
      entryPrice: 200,
    });
    expect(sig.action).toBe("exit");
  });
});
