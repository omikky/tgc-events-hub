import { loadConfig } from "./config.js";
import { createExchange } from "./exchanges/index.js";
import { createStrategy } from "./strategies/index.js";
import { TradingBot } from "./core/TradingBot.js";
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
  const bot = new TradingBot(config, exchange, strategy);

  await bot.init();

  const shutdown = () => {
    log.info("Shutting down...");
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
