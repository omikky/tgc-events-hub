import { log } from "../utils/logger.js";

export interface TelegramMessage {
  chatId: number;
  text: string;
  from?: string;
}

export type MessageHandler = (msg: TelegramMessage) => void | Promise<void>;

interface RawUpdate {
  update_id: number;
  message?: { chat: { id: number }; text?: string; from?: { username?: string } };
}

/**
 * Minimal Telegram Bot API client built on the global fetch — no third-party
 * dependency. Uses long-polling (getUpdates), so the bot needs NO public URL or
 * webhook: it works behind NAT, on a phone, or any VPS.
 */
export class TelegramClient {
  private offset = 0;
  private polling = false;
  private readonly base: string;

  constructor(private readonly token: string) {
    this.base = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(chatId: number | string, text: string): Promise<void> {
    try {
      const res = await fetch(`${this.base}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
      if (!res.ok) {
        log.warn("Telegram sendMessage failed", { status: res.status, body: await res.text() });
      }
    } catch (err) {
      log.warn("Telegram sendMessage error", { error: (err as Error).message });
    }
  }

  /** Verify the token and return the bot's @username, or null if invalid. */
  async getMe(): Promise<string | null> {
    try {
      const res = await fetch(`${this.base}/getMe`);
      const data = (await res.json()) as { ok: boolean; result?: { username?: string } };
      return data.ok ? (data.result?.username ?? "bot") : null;
    } catch {
      return null;
    }
  }

  /** Begin the long-poll loop, dispatching each text message to `handler`. */
  startPolling(handler: MessageHandler): void {
    if (this.polling) return;
    this.polling = true;
    void this.loop(handler);
  }

  stop(): void {
    this.polling = false;
  }

  private async loop(handler: MessageHandler): Promise<void> {
    while (this.polling) {
      try {
        const res = await fetch(
          `${this.base}/getUpdates?timeout=30&offset=${this.offset}`,
          { signal: AbortSignal.timeout(40_000) },
        );
        const data = (await res.json()) as { ok: boolean; result?: RawUpdate[] };
        for (const update of data.result ?? []) {
          this.offset = update.update_id + 1;
          const m = update.message;
          if (m?.text) {
            await handler({ chatId: m.chat.id, text: m.text, from: m.from?.username });
          }
        }
      } catch (err) {
        // Network blips / timeouts are expected with long-polling; back off briefly.
        log.debug("Telegram poll retry", { error: (err as Error).message });
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
}
