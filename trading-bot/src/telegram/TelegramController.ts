import type { TelegramConfig } from "../config.js";
import type { TradingBot } from "../core/TradingBot.js";
import type { BotEvent } from "../core/events.js";
import { log } from "../utils/logger.js";
import { TelegramClient, type TelegramMessage } from "./TelegramClient.js";
import { formatEvent, formatSnapshot, HELP_TEXT } from "./format.js";

/**
 * Bridges Telegram <-> the TradingBot:
 *   - pushes trade alerts (open/close/halt/error) to the authorized chat
 *   - handles commands (/status, /pause, /resume, /stop, ...)
 *
 * Only the configured TELEGRAM_CHAT_ID may control the bot. If no chat id is
 * set yet, the controller replies with the sender's chat id so the user can
 * configure it — but it will NOT execute any command until authorized.
 */
export class TelegramController {
  private readonly client: TelegramClient;
  private chatId: string;

  constructor(
    private readonly cfg: TelegramConfig,
    private readonly bot: TradingBot,
  ) {
    this.client = new TelegramClient(cfg.token);
    this.chatId = cfg.chatId;
  }

  /** Verify the token, announce startup, and begin handling commands. */
  async start(): Promise<void> {
    const username = await this.client.getMe();
    if (!username) {
      log.error("Telegram token rejected by getMe — check TELEGRAM_TOKEN");
      return;
    }
    log.info(`Telegram connected as @${username}`);
    if (this.chatId) {
      await this.client.sendMessage(this.chatId, "🤖 TGC bot online. Send /status.");
    } else {
      log.warn("TELEGRAM_CHAT_ID not set — message the bot once to get your chat id.");
    }
    this.client.startPolling((m) => this.onMessage(m));
  }

  stop(): void {
    this.client.stop();
  }

  /** Push a bot event to the authorized chat. */
  notify(event: BotEvent): void {
    if (!this.chatId) return;
    const text = formatEvent(event);
    if (text) void this.client.sendMessage(this.chatId, text);
  }

  private async onMessage(msg: TelegramMessage): Promise<void> {
    // Onboarding: no chat id configured yet -> tell the user theirs, do nothing else.
    if (!this.chatId) {
      await this.client.sendMessage(
        msg.chatId,
        `Your chat id is <code>${msg.chatId}</code>.\nSet <code>TELEGRAM_CHAT_ID=${msg.chatId}</code> in .env and restart to enable control.`,
      );
      return;
    }

    // Authorization: ignore anyone who isn't the configured chat.
    if (String(msg.chatId) !== String(this.chatId)) {
      log.warn("Ignoring Telegram command from unauthorized chat", { chatId: msg.chatId });
      await this.client.sendMessage(msg.chatId, "⛔ Not authorized.");
      return;
    }

    const cmd = msg.text.trim().split(/\s+/)[0]?.toLowerCase().replace(/@.*$/, "");
    try {
      await this.handleCommand(cmd ?? "");
    } catch (err) {
      await this.client.sendMessage(this.chatId, `⚠️ ${(err as Error).message}`);
    }
  }

  private async handleCommand(cmd: string): Promise<void> {
    const reply = (t: string) => this.client.sendMessage(this.chatId, t);
    switch (cmd) {
      case "/start":
      case "/help":
        await reply(HELP_TEXT);
        break;
      case "/status": {
        await reply(formatSnapshot(await this.bot.snapshot()));
        break;
      }
      case "/balance": {
        const s = await this.bot.snapshot();
        await reply(`💰 Equity: <b>${s.equity.toFixed(2)}</b> (${s.symbol.split("/")[1]})`);
        break;
      }
      case "/position": {
        const s = await this.bot.snapshot();
        await reply(
          s.position
            ? formatSnapshot(s)
            : "No open position.",
        );
        break;
      }
      case "/pause":
        this.bot.pauseEntries();
        await reply("⏸ Paused — no new entries. Existing position still managed.");
        break;
      case "/resume":
        this.bot.resumeEntries();
        await reply("▶️ Resumed — new entries allowed.");
        break;
      case "/stop":
        this.bot.stop();
        await reply("🛑 Stopping the bot loop.");
        break;
      default:
        await reply("Unknown command. Try /help");
    }
  }
}
