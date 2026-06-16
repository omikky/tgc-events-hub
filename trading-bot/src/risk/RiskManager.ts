import type { RiskConfig } from "../config.js";
import type { MarketInfo, Side } from "../types.js";

export interface PositionSizing {
  /** Amount in base currency to trade, already rounded to exchange precision. */
  amount: number;
  /** Stop-loss price. */
  stopLoss: number;
  /** Take-profit price. */
  takeProfit: number;
  /** Quote value of the position at entry. */
  notional: number;
}

export type SizingResult =
  | { ok: true; sizing: PositionSizing }
  | { ok: false; reason: string };

/**
 * Owns all money-at-risk decisions. The strategy decides *whether* to trade;
 * the RiskManager decides *how much* and *where the exits are*, and can veto a
 * trade entirely (too small, breaches limits, etc.). Keeping this separate is
 * what stops a strategy bug from blowing up the account.
 */
export class RiskManager {
  constructor(private readonly cfg: RiskConfig) {}

  /**
   * Risk-based position sizing. We risk `riskPerTrade` of equity, and the
   * distance from entry to stop defines how many units that buys:
   *
   *   amount = (equity * riskPerTrade) / (entry - stopLoss)
   *
   * This way a wider stop -> smaller size, so the dollar loss if stopped out is
   * roughly constant regardless of volatility.
   */
  sizeLong(equity: number, entryPrice: number, market: MarketInfo): SizingResult {
    if (equity <= 0) return { ok: false, reason: "no equity" };
    if (entryPrice <= 0) return { ok: false, reason: "bad entry price" };

    const stopLoss = entryPrice * (1 - this.cfg.stopLossPct);
    const takeProfit = entryPrice * (1 + this.cfg.takeProfitPct);
    const riskPerUnit = entryPrice - stopLoss;
    if (riskPerUnit <= 0) return { ok: false, reason: "stop-loss not below entry" };

    const riskBudget = equity * this.cfg.riskPerTrade;
    let amount = riskBudget / riskPerUnit;

    // Never risk more than the equity can actually buy.
    const maxAffordable = equity / entryPrice;
    if (amount > maxAffordable) amount = maxAffordable;

    amount = this.roundDown(amount, market.amountPrecision);

    if (amount <= 0) return { ok: false, reason: "computed size rounds to zero" };
    if (market.minAmount && amount < market.minAmount) {
      return {
        ok: false,
        reason: `size ${amount} below exchange minimum ${market.minAmount}`,
      };
    }
    const notional = amount * entryPrice;
    if (market.minCost && notional < market.minCost) {
      return {
        ok: false,
        reason: `notional ${notional.toFixed(2)} below exchange minimum ${market.minCost}. ` +
          `Increase capital or risk-per-trade.`,
      };
    }

    return {
      ok: true,
      sizing: {
        amount,
        stopLoss: this.round(stopLoss, market.pricePrecision),
        takeProfit: this.round(takeProfit, market.pricePrecision),
        notional,
      },
    };
  }

  /** Has the open position hit its stop or target? */
  exitForPrice(
    side: Side,
    price: number,
    stopLoss: number,
    takeProfit: number,
  ): "stop_loss" | "take_profit" | null {
    if (side === "buy") {
      if (price <= stopLoss) return "stop_loss";
      if (price >= takeProfit) return "take_profit";
    }
    return null;
  }

  /** Daily circuit-breaker: stop trading after losing too much in one day. */
  isDailyDrawdownBreached(dayStartEquity: number, currentEquity: number): boolean {
    if (dayStartEquity <= 0) return false;
    const drawdown = (dayStartEquity - currentEquity) / dayStartEquity;
    return drawdown >= this.cfg.maxDailyDrawdown;
  }

  canOpenAnother(openCount: number): boolean {
    return openCount < this.cfg.maxOpenPositions;
  }

  private round(value: number, decimals: number): number {
    const f = 10 ** decimals;
    return Math.round(value * f) / f;
  }

  private roundDown(value: number, decimals: number): number {
    const f = 10 ** decimals;
    return Math.floor(value * f) / f;
  }
}
