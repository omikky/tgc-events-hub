import type { Position } from "./Position.js";

/** Events the TradingBot emits so outside layers (Telegram, dashboards, logs)
 *  can react without the engine knowing about them. */
export type BotEvent =
  | { type: "open"; position: Position }
  | { type: "close"; reason: string; exitPrice: number; pnl: number }
  | { type: "halt"; equity: number; dayStartEquity: number }
  | { type: "error"; message: string }
  | { type: "info"; message: string };

export type BotEventHandler = (event: BotEvent) => void;

/** A point-in-time view of the bot, used by /status and the Mini App API. */
export interface BotSnapshot {
  mode: string;
  exchange: string;
  symbol: string;
  strategy: string;
  running: boolean;
  paused: boolean;
  halted: boolean;
  price: number;
  equity: number;
  dayStartEquity: number;
  dayPnl: number;
  dayPnlPct: number;
  position: (Position & { unrealizedPnl: number }) | null;
}
