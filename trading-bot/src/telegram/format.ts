import type { BotEvent, BotSnapshot } from "../core/events.js";

const f = (n: number, d = 2) => n.toFixed(d);
const sign = (n: number) => (n >= 0 ? "+" : "");

/** Renders /status output. Pure function -> easy to unit test. */
export function formatSnapshot(s: BotSnapshot): string {
  const state = !s.running ? "🛑 stopped" : s.halted ? "⛔ halted (drawdown)" : s.paused ? "⏸ paused" : "▶️ running";
  const lines = [
    `<b>TGC Bot — ${state}</b>`,
    `Mode: <b>${s.mode}</b> · ${s.exchange} · ${s.symbol}`,
    `Strategy: ${s.strategy}`,
    `Price: ${f(s.price)}`,
    `Equity: <b>${f(s.equity)}</b>`,
    `Today: ${sign(s.dayPnl)}${f(s.dayPnl)} (${sign(s.dayPnlPct)}${f(s.dayPnlPct)}%)`,
  ];
  if (s.position) {
    const p = s.position;
    lines.push(
      `\n<b>Open ${p.side}</b> ${f(p.amount, 6)} @ ${f(p.entryPrice)}`,
      `SL ${f(p.stopLoss)} · TP ${f(p.takeProfit)}`,
      `Unrealized: ${sign(p.unrealizedPnl)}${f(p.unrealizedPnl)}`,
    );
  } else {
    lines.push("\nNo open position");
  }
  return lines.join("\n");
}

/** Renders a push notification for a bot event, or null if it isn't notifiable. */
export function formatEvent(e: BotEvent): string | null {
  switch (e.type) {
    case "open":
      return `🟢 <b>OPENED</b> ${e.position.side} ${f(e.position.amount, 6)} @ ${f(e.position.entryPrice)}\nSL ${f(e.position.stopLoss)} · TP ${f(e.position.takeProfit)}`;
    case "close": {
      const emoji = e.pnl >= 0 ? "✅" : "🔻";
      return `${emoji} <b>CLOSED</b> (${e.reason}) @ ${f(e.exitPrice)}\nPnL: ${sign(e.pnl)}${f(e.pnl)}`;
    }
    case "halt":
      return `⛔ <b>Daily drawdown limit hit</b> — new entries halted for today.\nEquity ${f(e.equity)} of ${f(e.dayStartEquity)} start.`;
    case "error":
      return `⚠️ Bot error: ${e.message}`;
    case "info":
      return e.message;
  }
}

export const HELP_TEXT = [
  "<b>TGC Trading Bot</b>",
  "/status — current state, equity, position",
  "/balance — account equity",
  "/position — open position detail",
  "/pause — stop opening NEW trades (exits still run)",
  "/resume — allow new trades again",
  "/stop — stop the bot loop",
  "/help — this message",
].join("\n");
