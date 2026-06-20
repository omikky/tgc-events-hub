import type { Balance, Candle, MarketInfo, Order, OrderType, Side, Ticker } from "../types.js";
import type { ExchangeAdapter } from "./ExchangeAdapter.js";
import { log } from "../utils/logger.js";

/** Small seeded PRNG (mulberry32) so demo runs are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Offline market-data source: generates a synthetic price series with a random
 * walk so the bot can run with NO network and NO exchange account. Use it with
 * `EXCHANGE=demo` to preview the engine end-to-end (signals, entries, exits,
 * P&L) before touching a real venue. Paired with the PaperAdapter in paper
 * mode, fills are simulated too — nothing leaves the machine.
 *
 * The history is seeded as an uptrend ending in a dip, so the scalping strategy
 * finds an entry almost immediately and you can watch a full trade play out.
 */
export class DemoAdapter implements ExchangeAdapter {
  readonly id = "demo";
  private candles: Candle[] = [];
  private readonly rng = mulberry32(1337);
  private t = 0;
  private price = 100;

  constructor(private readonly symbol: string) {}

  /**
   * Price model: a gently rising baseline with a slow oscillation on top. The
   * oscillation's troughs create pullbacks that push RSI oversold while the
   * rising baseline keeps price above the slow trend EMA — exactly the "dip in
   * an uptrend" the scalper looks for, so trades actually happen in a preview.
   */
  private priceAt(t: number): number {
    const baseline = 100 * (1 + 0.001 * t); // ~+0.1%/candle drift up
    const osc = Math.sin(t / 5) * baseline * 0.03; // ±3% cycle (~31-candle period)
    const noise = (this.rng() - 0.5) * baseline * 0.004;
    return Math.max(1, baseline + osc + noise);
  }

  async loadMarkets(): Promise<void> {
    // Seed enough history to clear the strategy warmup (~69 candles).
    const now = Date.now();
    const seedCount = 90;
    for (this.t = 0; this.t < seedCount; this.t++) {
      this.price = this.priceAt(this.t);
      this.candles.push(this.toCandle(this.price, now - (seedCount - this.t) * 60_000));
    }
    log.info("DEMO mode: using synthetic offline market data (no network).");
  }

  private toCandle(close: number, ts: number): Candle {
    const wobble = close * 0.001;
    return {
      timestamp: ts,
      open: close - wobble,
      high: close + wobble,
      low: close - wobble,
      close,
      volume: 1,
    };
  }

  /** Advance the simulation by one candle. */
  private advance(): void {
    this.price = this.priceAt(this.t++);
    this.candles.push(this.toCandle(this.price, Date.now()));
    if (this.candles.length > 400) this.candles.shift();
  }

  getMarket(_symbol: string): MarketInfo {
    return { symbol: this.symbol, minAmount: 0.00001, minCost: 5, amountPrecision: 5, pricePrecision: 2 };
  }

  async fetchOHLCV(_symbol: string, _timeframe: string, limit: number): Promise<Candle[]> {
    this.advance();
    return this.candles.slice(-limit);
  }

  async fetchTicker(_symbol: string): Promise<Ticker> {
    return { symbol: this.symbol, bid: this.price * 0.9999, ask: this.price * 1.0001, last: this.price };
  }

  async fetchBalance(): Promise<Balance> {
    const quote = this.symbol.split("/")[1] ?? "USDT";
    return { free: { [quote]: 1000 }, total: { [quote]: 1000 } };
  }

  async createOrder(
    symbol: string,
    side: Side,
    type: OrderType,
    amount: number,
    price?: number,
  ): Promise<Order> {
    // Only reached if someone runs demo in live mode; behaves like an instant fill.
    return {
      id: `demo-${Date.now()}`,
      symbol,
      side,
      type,
      amount,
      price: price ?? this.price,
      fee: 0,
      timestamp: Date.now(),
    };
  }
}
