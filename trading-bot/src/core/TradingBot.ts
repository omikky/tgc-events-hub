import type { BotConfig } from "../config.js";
import type { ExchangeAdapter } from "../exchanges/ExchangeAdapter.js";
import type { Strategy } from "../strategies/Strategy.js";
import { RiskManager } from "../risk/RiskManager.js";
import { log } from "../utils/logger.js";
import { unrealizedPnl, type Position } from "./Position.js";
import type { BotEvent, BotEventHandler, BotSnapshot } from "./events.js";

/**
 * The orchestrator. On each tick it:
 *   1. Checks the daily drawdown circuit-breaker.
 *   2. Fetches fresh candles + price.
 *   3. If in a position, enforces hard stop-loss / take-profit FIRST.
 *   4. Asks the strategy for a signal and acts on it (entry sized by the
 *      RiskManager, soft exits as the strategy dictates).
 *
 * It is exchange- and strategy-agnostic: everything comes through interfaces.
 * Control (pause/resume/stop) and notifications are exposed so a Telegram bot
 * or dashboard can drive it without the engine knowing those layers exist.
 */
export class TradingBot {
  private readonly risk: RiskManager;
  private position: Position | null = null;
  private dayStartEquity = 0;
  private dayKey = "";
  private halted = false;
  private paused = false;
  private running = false;
  private lastPrice = 0;

  constructor(
    private readonly config: BotConfig,
    private readonly exchange: ExchangeAdapter,
    private readonly strategy: Strategy,
    private readonly onEvent: BotEventHandler = () => {},
  ) {
    this.risk = new RiskManager(config.risk);
  }

  private emit(event: BotEvent): void {
    try {
      this.onEvent(event);
    } catch (err) {
      log.warn("Event handler threw", { error: (err as Error).message });
    }
  }

  async init(): Promise<void> {
    await this.exchange.loadMarkets();
    const equity = await this.equity();
    this.rollDay(equity);
    log.info("Bot initialised", {
      exchange: this.exchange.id,
      mode: this.config.mode,
      symbol: this.config.symbol,
      strategy: this.strategy.name,
      equity: equity.toFixed(2),
    });
    if (this.config.mode === "live") {
      log.warn("LIVE MODE: real orders with real funds will be placed.");
    }
  }

  /** Runs the polling loop until stop() is called. */
  async run(): Promise<void> {
    this.running = true;
    while (this.running) {
      try {
        await this.tick();
      } catch (err) {
        const message = (err as Error).message;
        log.error("Tick failed", { error: message });
        this.emit({ type: "error", message });
      }
      await this.sleep(this.config.pollIntervalSeconds * 1000);
    }
  }

  stop(): void {
    this.running = false;
  }

  // --- Control surface (used by Telegram / dashboard) ---

  /** Stop opening NEW positions. Existing positions are still managed (exits,
   *  stop-loss, take-profit all keep working) — pausing must never strand a
   *  position without its safety exits. */
  pauseEntries(): void {
    this.paused = true;
    log.info("Entries paused");
  }

  resumeEntries(): void {
    this.paused = false;
    log.info("Entries resumed");
  }

  isPaused(): boolean {
    return this.paused;
  }

  isRunning(): boolean {
    return this.running;
  }

  /** A fresh point-in-time view. Hits the exchange for price + balance. */
  async snapshot(): Promise<BotSnapshot> {
    const equity = await this.equity();
    const ticker = await this.exchange.fetchTicker(this.config.symbol);
    const price = ticker.last;
    const dayPnl = equity - this.dayStartEquity;
    return {
      mode: this.config.mode,
      exchange: this.exchange.id,
      symbol: this.config.symbol,
      strategy: this.strategy.name,
      running: this.running,
      paused: this.paused,
      halted: this.halted,
      price,
      equity,
      dayStartEquity: this.dayStartEquity,
      dayPnl,
      dayPnlPct: this.dayStartEquity > 0 ? (dayPnl / this.dayStartEquity) * 100 : 0,
      position: this.position
        ? { ...this.position, unrealizedPnl: unrealizedPnl(this.position, price) }
        : null,
    };
  }

  /** A single evaluation cycle. Exposed for testing/backtests. */
  async tick(): Promise<void> {
    const equity = await this.equity();
    this.rollDay(equity);

    if (this.risk.isDailyDrawdownBreached(this.dayStartEquity, equity)) {
      if (!this.halted) {
        this.halted = true;
        log.warn("Daily drawdown limit hit — halting new entries for today", {
          dayStartEquity: this.dayStartEquity.toFixed(2),
          equity: equity.toFixed(2),
        });
        this.emit({ type: "halt", equity, dayStartEquity: this.dayStartEquity });
      }
    }

    const candles = await this.exchange.fetchOHLCV(
      this.config.symbol,
      this.config.timeframe,
      Math.max(this.strategy.warmupCandles + 5, 100),
    );
    const ticker = await this.exchange.fetchTicker(this.config.symbol);
    const price = ticker.last;
    this.lastPrice = price;

    // 1) Hard exits always take priority over strategy opinion.
    if (this.position) {
      const hit = this.risk.exitForPrice(
        this.position.side,
        price,
        this.position.stopLoss,
        this.position.takeProfit,
      );
      if (hit) {
        await this.closePosition(price, hit);
        return;
      }
    }

    // 2) Strategy signal.
    const signal = this.strategy.evaluate({
      candles,
      inPosition: this.position !== null,
      entryPrice: this.position?.entryPrice,
    });
    log.debug("Signal", { action: signal.action, reason: signal.reason, price });

    if (signal.action === "enter_long" && !this.position) {
      if (this.halted || this.paused) {
        log.info("Skipping entry", { halted: this.halted, paused: this.paused });
        return;
      }
      if (!this.risk.canOpenAnother(this.position ? 1 : 0)) return;
      await this.openLong(price, equity);
    } else if (signal.action === "exit" && this.position) {
      await this.closePosition(price, "strategy");
    }
  }

  private async openLong(price: number, equity: number): Promise<void> {
    const market = this.exchange.getMarket(this.config.symbol);
    const result = this.risk.sizeLong(equity, price, market);
    if (!result.ok) {
      log.info("Entry vetoed by risk manager", { reason: result.reason });
      return;
    }
    const { amount, stopLoss, takeProfit, notional } = result.sizing;
    const order = await this.exchange.createOrder(this.config.symbol, "buy", "market", amount);
    this.position = {
      symbol: this.config.symbol,
      side: "buy",
      amount: order.amount,
      entryPrice: order.price,
      stopLoss,
      takeProfit,
      openedAt: order.timestamp,
    };
    log.info("OPENED long", {
      amount: order.amount,
      entry: order.price,
      stopLoss,
      takeProfit,
      notional: notional.toFixed(2),
      fee: order.fee.toFixed(4),
    });
    this.emit({ type: "open", position: { ...this.position } });
  }

  private async closePosition(price: number, why: string): Promise<void> {
    if (!this.position) return;
    const pos = this.position;
    const order = await this.exchange.createOrder(pos.symbol, "sell", "market", pos.amount);
    const pnl = unrealizedPnl({ ...pos }, order.price);
    this.position = null;
    log.info("CLOSED position", {
      reason: why,
      exit: order.price,
      pnl: pnl.toFixed(4),
      fee: order.fee.toFixed(4),
    });
    this.emit({ type: "close", reason: why, exitPrice: order.price, pnl });
  }

  /** Total account equity in the quote currency (free quote + position value). */
  private async equity(): Promise<number> {
    const [base, quote] = this.config.symbol.split("/");
    const balance = await this.exchange.fetchBalance();
    const quoteBal = balance.total[quote ?? "USDT"] ?? 0;
    const baseBal = balance.total[base ?? ""] ?? 0;
    if (baseBal > 0) {
      const t = await this.exchange.fetchTicker(this.config.symbol);
      return quoteBal + baseBal * t.last;
    }
    return quoteBal;
  }

  private rollDay(equity: number): void {
    const key = new Date().toISOString().slice(0, 10);
    if (key !== this.dayKey) {
      this.dayKey = key;
      this.dayStartEquity = equity;
      this.halted = false;
      log.info("New trading day", { day: key, startEquity: equity.toFixed(2) });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
