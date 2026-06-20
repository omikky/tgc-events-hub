import type { Balance, Candle, MarketInfo, Order, OrderType, Side, Ticker } from "../types.js";
import type { ExchangeAdapter } from "./ExchangeAdapter.js";
import { log } from "../utils/logger.js";

/**
 * Paper-trading adapter. It pulls REAL market data from an underlying live
 * adapter (so signals are realistic) but simulates order fills against an
 * in-memory balance — no real money moves. This is the default mode so you can
 * validate a strategy before risking capital. Fills include a configurable fee
 * and fill at the current ask (buys) / bid (sells) to approximate slippage.
 */
export class PaperAdapter implements ExchangeAdapter {
  readonly id: string;
  private orderSeq = 0;

  constructor(
    private readonly data: ExchangeAdapter,
    private readonly quoteCurrency: string,
    private startingBalance: number,
    private readonly feeRate: number,
  ) {
    this.id = `paper:${data.id}`;
    this.balances[quoteCurrency] = startingBalance;
  }

  private balances: Record<string, number> = {};

  async loadMarkets(): Promise<void> {
    await this.data.loadMarkets();
  }

  getMarket(symbol: string): MarketInfo {
    return this.data.getMarket(symbol);
  }

  fetchOHLCV(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    return this.data.fetchOHLCV(symbol, timeframe, limit);
  }

  fetchTicker(symbol: string): Promise<Ticker> {
    return this.data.fetchTicker(symbol);
  }

  async fetchBalance(): Promise<Balance> {
    return { free: { ...this.balances }, total: { ...this.balances } };
  }

  async createOrder(
    symbol: string,
    side: Side,
    type: OrderType,
    amount: number,
    price?: number,
  ): Promise<Order> {
    const ticker = await this.data.fetchTicker(symbol);
    // Market orders fill at the touch; limit orders assume their limit price.
    const fillPrice =
      type === "limit" && price !== undefined ? price : side === "buy" ? ticker.ask : ticker.bid;

    const [base, quote] = symbol.split("/");
    if (!base || !quote) throw new Error(`Bad symbol ${symbol}`);

    const cost = amount * fillPrice;
    const fee = cost * this.feeRate;

    if (side === "buy") {
      const needed = cost + fee;
      if ((this.balances[quote] ?? 0) < needed) {
        throw new Error(
          `Paper: insufficient ${quote} (need ${needed.toFixed(2)}, have ${(this.balances[quote] ?? 0).toFixed(2)})`,
        );
      }
      this.balances[quote] = (this.balances[quote] ?? 0) - needed;
      this.balances[base] = (this.balances[base] ?? 0) + amount;
    } else {
      if ((this.balances[base] ?? 0) < amount) {
        throw new Error(
          `Paper: insufficient ${base} (need ${amount}, have ${this.balances[base] ?? 0})`,
        );
      }
      this.balances[base] = (this.balances[base] ?? 0) - amount;
      this.balances[quote] = (this.balances[quote] ?? 0) + (cost - fee);
    }

    const order: Order = {
      id: `paper-${++this.orderSeq}`,
      symbol,
      side,
      type,
      amount,
      price: fillPrice,
      fee,
      timestamp: Date.now(),
    };
    log.debug("Paper fill", { ...order });
    return order;
  }
}
