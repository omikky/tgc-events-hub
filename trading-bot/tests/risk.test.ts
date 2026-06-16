import { describe, it, expect } from "vitest";
import { RiskManager } from "../src/risk/RiskManager.js";
import type { RiskConfig } from "../src/config.js";
import type { MarketInfo } from "../src/types.js";

const cfg: RiskConfig = {
  riskPerTrade: 0.01,
  stopLossPct: 0.005,
  takeProfitPct: 0.01,
  maxOpenPositions: 1,
  maxDailyDrawdown: 0.05,
  feeRate: 0.001,
};

const market: MarketInfo = {
  symbol: "BTC/USDT",
  minAmount: 0.00001,
  minCost: 5,
  amountPrecision: 5,
  pricePrecision: 2,
};

describe("RiskManager.sizeLong", () => {
  it("sizes so that hitting the stop loses ~riskPerTrade of equity", () => {
    // Use a stop (2%) wider than the risk budget (1%) so the position fits
    // within equity on spot and the risk formula isn't affordability-capped.
    const wideStop: RiskConfig = { ...cfg, stopLossPct: 0.02 };
    const equity = 10_000;
    const entry = 100;
    const res = new RiskManager(wideStop).sizeLong(equity, entry, market);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const lossAtStop = (entry - res.sizing.stopLoss) * res.sizing.amount;
    // 1% of 10k = 100, allow rounding slack from precision.
    expect(lossAtStop).toBeGreaterThan(95);
    expect(lossAtStop).toBeLessThanOrEqual(100.5);
  });

  it("caps size to equity on spot when a tight stop would imply leverage", () => {
    // 1% risk with a 0.5% stop implies a 2x-notional position; on spot we can't
    // borrow, so size is capped at full equity and realized risk is lower (safe).
    const equity = 10_000;
    const entry = 100;
    const res = new RiskManager(cfg).sizeLong(equity, entry, market);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.sizing.notional).toBeLessThanOrEqual(equity + 1e-6);
    const lossAtStop = (entry - res.sizing.stopLoss) * res.sizing.amount;
    expect(lossAtStop).toBeLessThan(equity * cfg.riskPerTrade); // < 1% target
  });

  it("places stop below and target above entry", () => {
    const res = new RiskManager(cfg).sizeLong(10_000, 100, market);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.sizing.stopLoss).toBeLessThan(100);
    expect(res.sizing.takeProfit).toBeGreaterThan(100);
  });

  it("vetoes a trade whose notional is below the exchange minimum", () => {
    // A $3 account can't even meet the exchange's $5 minimum order value, so the
    // risk manager refuses rather than placing an invalid order. This is exactly
    // why "scalp with $5" doesn't work in practice.
    const res = new RiskManager(cfg).sizeLong(3, 100, market);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/minimum/);
  });

  it("never sizes beyond what equity can buy", () => {
    const equity = 50;
    const entry = 100;
    // Loosen risk so the formula would otherwise overshoot affordability.
    const big: RiskConfig = { ...cfg, riskPerTrade: 1, stopLossPct: 0.001 };
    const res = new RiskManager(big).sizeLong(equity, entry, market);
    if (res.ok) {
      expect(res.sizing.amount * entry).toBeLessThanOrEqual(equity + 1e-9);
    }
  });
});

describe("RiskManager exits & circuit breaker", () => {
  const rm = new RiskManager(cfg);

  it("detects stop-loss and take-profit hits for longs", () => {
    expect(rm.exitForPrice("buy", 94, 95, 110)).toBe("stop_loss");
    expect(rm.exitForPrice("buy", 111, 95, 110)).toBe("take_profit");
    expect(rm.exitForPrice("buy", 100, 95, 110)).toBeNull();
  });

  it("triggers the daily drawdown breaker at the threshold", () => {
    expect(rm.isDailyDrawdownBreached(1000, 960)).toBe(false); // 4% < 5%
    expect(rm.isDailyDrawdownBreached(1000, 950)).toBe(true); // 5% == limit
    expect(rm.isDailyDrawdownBreached(1000, 900)).toBe(true); // 10% > limit
  });

  it("enforces max open positions", () => {
    expect(rm.canOpenAnother(0)).toBe(true);
    expect(rm.canOpenAnother(1)).toBe(false);
  });
});
