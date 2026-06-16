import { loadConfig } from "./config.js";
import { createExchange } from "./exchanges/index.js";
import { createStrategy } from "./strategies/index.js";
import { TradingBot } from "./core/TradingBot.js";
import { TelegramController } from "./telegram/TelegramController.js";
import { ApiServer } from "./server/ApiServer.js";
import { log } from "./utils/logger.js";

async function main() {
  const config = loadConfig();

  const banner =
    config.mode === "live"
      ? "  *** LIVE TRADING — REAL MONEY AT RISK ***"
      : "  paper trading — simulated fills, no real money";
  log.info("===========================================================");
  log.info("  TGC Trading Bot");
  log.info(banner);
  log.info("===========================================================");

  const exchange = createExchange(config);
  const strategy = createStrategy(config.strategy);

  // The bot emits events; the Telegram controller (created next) forwards them.
  // A deferred reference breaks the bot <-> controller cycle.
  let controller: TelegramController | null = null;
  const bot = new TradingBot(config, exchange, strategy, (event) => controller?.notify(event));

  await bot.init();

  if (config.telegram.enabled) {
    controller = new TelegramController(config.telegram, bot);
    await controller.start();
  } else {
    log.info("Telegram disabled (set TELEGRAM_TOKEN to enable phone control).");
  }

  let apiServer: ApiServer | null = null;
  if (config.miniApp.enabled) {
    if (!config.telegram.token) {
      log.error("Mini App needs TELEGRAM_TOKEN to validate requests — disabling it.");
    } else {
      apiServer = new ApiServer(config.miniApp, config.telegram, bot);
      apiServer.start();
    }
  }

  const shutdown = () => {
    log.info("Shutting down...");
    controller?.stop();
    apiServer?.stop();
    bot.stop();
    setTimeout(() => process.exit(0), 250);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await bot.run();
}

main().catch((err) => {
  log.error("Fatal error", { error: (err as Error).message });
  process.exit(1);
});
