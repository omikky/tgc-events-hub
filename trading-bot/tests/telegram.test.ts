import { describe, it, expect } from "vitest";
import { formatSnapshot, formatEvent } from "../src/telegram/format.js";
import type { BotSnapshot } from "../src/core/events.js";

const base: BotSnapshot = {
  mode: "paper",
  exchange: "binance",
  symbol: "BTC/USDT",
  strategy: "scalping",
  running: true,
  paused: false,
  halted: false,
  price: 50000,
  equity: 1000,
  dayStartEquity: 1000,
  dayPnl: 0,
  dayPnlPct: 0,
  position: null,
};

describe("formatSnapshot", () => {
  it("shows running state and no-position line", () => {
    const out = formatSnapshot(base);
    expect(out).toContain("running");
    expect(out).toContain("No open position");
  });

  it("reflects paused and halted states", () => {
    expect(formatSnapshot({ ...base, paused: true })).toContain("paused");
    expect(formatSnapshot({ ...base, halted: true })).toContain("halted");
    expect(formatSnapshot({ ...base, running: false })).toContain("stopped");
  });

  it("renders open position with unrealized pnl", () => {
    const out = formatSnapshot({
      ...base,
      position: {
        symbol: "BTC/USDT",
        side: "buy",
        amount: 0.01,
        entryPrice: 49000,
        stopLoss: 48000,
        takeProfit: 51000,
        openedAt: Date.now(),
        unrealizedPnl: 10,
      },
    });
    expect(out).toContain("Open buy");
    expect(out).toContain("+10.00");
  });
});

describe("formatEvent", () => {
  it("formats open/close/halt events", () => {
    expect(
      formatEvent({
        type: "open",
        position: {
          symbol: "BTC/USDT",
          side: "buy",
          amount: 0.01,
          entryPrice: 49000,
          stopLoss: 48000,
          takeProfit: 51000,
          openedAt: 0,
        },
      }),
    ).toContain("OPENED");

    const win = formatEvent({ type: "close", reason: "take_profit", exitPrice: 51000, pnl: 20 });
    expect(win).toContain("CLOSED");
    expect(win).toContain("+20.00");

    const loss = formatEvent({ type: "close", reason: "stop_loss", exitPrice: 48000, pnl: -10 });
    expect(loss).toContain("-10.00");

    expect(formatEvent({ type: "halt", equity: 950, dayStartEquity: 1000 })).toContain("drawdown");
  });
});
