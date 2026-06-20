// Shared domain types for the trading bot.

export type Side = "buy" | "sell";
export type OrderType = "market" | "limit";

/** A single OHLCV candle. Timestamps are unix milliseconds. */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
}

/** Market metadata we care about for safe order placement. */
export interface MarketInfo {
  symbol: string;
  /** Minimum order amount in base currency (e.g. BTC). */
  minAmount: number;
  /** Minimum order value in quote currency (e.g. USDT). */
  minCost: number;
  /** Decimal places allowed for the amount. */
  amountPrecision: number;
  /** Decimal places allowed for the price. */
  pricePrecision: number;
}

export interface Balance {
  /** Free balance available to trade, keyed by currency code. */
  free: Record<string, number>;
  total: Record<string, number>;
}

export interface Order {
  id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  /** Amount in base currency. */
  amount: number;
  /** Average fill price (quote per base). */
  price: number;
  /** Fee paid in quote currency. */
  fee: number;
  timestamp: number;
}

/** What a strategy emits each time it is evaluated. */
export type SignalAction = "enter_long" | "exit" | "hold";

export interface Signal {
  action: SignalAction;
  /** Free-form reason for logs/audit. */
  reason: string;
  /** Optional strategy-suggested overrides (fractions of price). */
  stopLossPct?: number;
  takeProfitPct?: number;
}
