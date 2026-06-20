import ccxt, { type Exchange } from "ccxt";
import type { Balance, Candle, MarketInfo, Order, OrderType, Side, Ticker } from "../types.js";
import type { ExchangeAdapter } from "./ExchangeAdapter.js";
import { log } from "../utils/logger.js";

export interface CcxtAdapterOptions {
  exchangeId: string;
  apiKey: string;
  apiSecret: string;
  password?: string;
  useTestnet: boolean;
}

/**
 * Universal adapter backed by ccxt. Works with binance, bybit, bingx and the
 * 100+ other exchanges ccxt supports, all behind the same ExchangeAdapter
 * interface. This is the "link any account" piece of the request.
 */
export class CcxtAdapter implements ExchangeAdapter {
  readonly id: string;
  private readonly ex: Exchange;
  private markets: Record<string, MarketInfo> = {};

  constructor(opts: CcxtAdapterOptions) {
    this.id = opts.exchangeId;

    const ExchangeClass = (ccxt as unknown as Record<string, new (cfg: object) => Exchange>)[
      opts.exchangeId
    ];
    if (!ExchangeClass) {
      throw new Error(
        `Unknown exchange "${opts.exchangeId}". See ccxt.exchanges for valid ids.`,
      );
    }

    this.ex = new ExchangeClass({
      apiKey: opts.apiKey,
      secret: opts.apiSecret,
      password: opts.password,
      enableRateLimit: true,
    });

    if (opts.useTestnet) {
      // ccxt exposes sandbox mode where the exchange supports it.
      try {
        this.ex.setSandboxMode(true);
        log.info(`Sandbox/testnet mode enabled for ${opts.exchangeId}`);
      } catch {
        log.warn(`${opts.exchangeId} has no sandbox; using production endpoints`);
      }
    }
  }

  async loadMarkets(): Promise<void> {
    const raw = await this.ex.loadMarkets();
    for (const [symbol, m] of Object.entries(raw)) {
      const market = m as Record<string, any>;
      this.markets[symbol] = {
        symbol,
        minAmount: market.limits?.amount?.min ?? 0,
        minCost: market.limits?.cost?.min ?? 0,
        amountPrecision: this.precisionToDecimals(market.precision?.amount),
        pricePrecision: this.precisionToDecimals(market.precision?.price),
      };
    }
    log.info(`Loaded ${Object.keys(this.markets).length} markets from ${this.id}`);
  }

  private precisionToDecimals(p: unknown): number {
    // ccxt precision can be a count of decimals or a tick size depending on
    // the exchange's precisionMode. Normalise to a decimal-place count.
    if (typeof p !== "number") return 8;
    if (p >= 1) return Math.round(p); // already a decimal count
    if (p > 0 && p < 1) return Math.round(-Math.log10(p)); // tick size -> decimals
    return 0;
  }

  getMarket(symbol: string): MarketInfo {
    const m = this.markets[symbol];
    if (!m) throw new Error(`Market ${symbol} not loaded. Did loadMarkets() run?`);
    return m;
  }

  async fetchOHLCV(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    const rows = await this.ex.fetchOHLCV(symbol, timeframe, undefined, limit);
    return rows.map((r) => ({
      timestamp: Number(r[0]),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }));
  }

  async fetchTicker(symbol: string): Promise<Ticker> {
    const t = await this.ex.fetchTicker(symbol);
    const last = Number(t.last ?? t.close ?? 0);
    return {
      symbol,
      bid: Number(t.bid ?? last),
      ask: Number(t.ask ?? last),
      last,
    };
  }

  async fetchBalance(): Promise<Balance> {
    const b = await this.ex.fetchBalance();
    return {
      free: (b.free as unknown as Record<string, number>) ?? {},
      total: (b.total as unknown as Record<string, number>) ?? {},
    };
  }

  async createOrder(
    symbol: string,
    side: Side,
    type: OrderType,
    amount: number,
    price?: number,
  ): Promise<Order> {
    const o = await this.ex.createOrder(symbol, type, side, amount, price);
    const filledPrice = Number(o.average ?? o.price ?? price ?? 0);
    const feeCost = Number((o.fee as { cost?: number } | undefined)?.cost ?? 0);
    return {
      id: String(o.id),
      symbol,
      side,
      type,
      amount: Number(o.filled ?? o.amount ?? amount),
      price: filledPrice,
      fee: feeCost,
      timestamp: Number(o.timestamp ?? Date.now()),
    };
  }
}
