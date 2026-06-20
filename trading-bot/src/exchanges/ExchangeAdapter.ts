import type { Balance, Candle, MarketInfo, Order, OrderType, Side, Ticker } from "../types.js";

/**
 * The single interface every exchange must satisfy. Add a new exchange by
 * implementing this (or, for any of ccxt's 100+ exchanges, just by passing its
 * id to CcxtAdapter). Nothing in the strategy/risk/core layers depends on a
 * specific exchange — that is what makes the bot modular.
 */
export interface ExchangeAdapter {
  readonly id: string;

  /** Load market metadata. Must be called once before trading. */
  loadMarkets(): Promise<void>;

  fetchOHLCV(symbol: string, timeframe: string, limit: number): Promise<Candle[]>;
  fetchTicker(symbol: string): Promise<Ticker>;
  fetchBalance(): Promise<Balance>;

  /** Market metadata (limits/precision) for safe order sizing. */
  getMarket(symbol: string): MarketInfo;

  createOrder(
    symbol: string,
    side: Side,
    type: OrderType,
    amount: number,
    price?: number,
  ): Promise<Order>;
}
