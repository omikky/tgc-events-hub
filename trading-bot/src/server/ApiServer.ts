import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { MiniAppConfig, TelegramConfig } from "../config.js";
import type { TradingBot } from "../core/TradingBot.js";
import { log } from "../utils/logger.js";
import { validateInitData } from "./initData.js";

const MINIAPP_HTML = fileURLToPath(new URL("../../miniapp/index.html", import.meta.url));

/**
 * Tiny HTTP server (no framework) that backs the Telegram Mini App:
 *   GET  /             -> the dashboard HTML
 *   GET  /api/status   -> current BotSnapshot (JSON)
 *   POST /api/control  -> { action: "pause" | "resume" | "stop" }
 *
 * Every /api call must carry a valid Telegram `initData` (header
 * `x-init-data`), and the authenticated user must match the authorized chat —
 * so only the owner can see state or send commands.
 */
export class ApiServer {
  private server: http.Server | null = null;

  constructor(
    private readonly cfg: MiniAppConfig,
    private readonly telegram: TelegramConfig,
    private readonly bot: TradingBot,
  ) {}

  start(): void {
    this.server = http.createServer((req, res) => void this.handle(req, res));
    this.server.listen(this.cfg.port, () => {
      log.info(`Mini App server listening on :${this.cfg.port}`, {
        publicUrl: this.cfg.publicUrl || "(set MINIAPP_PUBLIC_URL)",
      });
    });
  }

  stop(): void {
    this.server?.close();
  }

  private async handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://localhost:${this.cfg.port}`);

    try {
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        const html = await readFile(MINIAPP_HTML, "utf8");
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(html);
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        await this.handleApi(req, res, url);
        return;
      }

      res.writeHead(404).end("not found");
    } catch (err) {
      log.warn("Mini App request failed", { error: (err as Error).message });
      res.writeHead(500).end("error");
    }
  }

  private async handleApi(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    url: URL,
  ): Promise<void> {
    const initData = (req.headers["x-init-data"] as string | undefined) ?? "";
    const auth = validateInitData(initData, this.telegram.token);

    const authorized =
      auth.ok &&
      (!this.telegram.chatId || String(auth.userId) === String(this.telegram.chatId));

    if (!authorized) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
      const snapshot = await this.bot.snapshot();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(snapshot));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/control") {
      const body = await readBody(req);
      const action = (JSON.parse(body || "{}") as { action?: string }).action;
      switch (action) {
        case "pause":
          this.bot.pauseEntries();
          break;
        case "resume":
          this.bot.resumeEntries();
          break;
        case "stop":
          this.bot.stop();
          break;
        default:
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "unknown action" }));
          return;
      }
      log.info("Mini App control", { action, user: auth.username });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, action }));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error("body too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
