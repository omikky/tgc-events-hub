import type { BotConfig } from "../config.js";
import type { ExchangeAdapter } from "./ExchangeAdapter.js";
import { CcxtAdapter } from "./CcxtAdapter.js";
import { DemoAdapter } from "./DemoAdapter.js";
import { PaperAdapter } from "./PaperAdapter.js";

/**
 * Builds the right exchange adapter for the configured mode. In paper mode the
 * live adapter is still used for market data, wrapped by the paper engine.
 */
export function createExchange(config: BotConfig): ExchangeAdapter {
  // Offline demo: synthetic data, no network, no account.
  const live: ExchangeAdapter =
    config.exchange === "demo"
      ? new DemoAdapter(config.symbol)
      : new CcxtAdapter({
          exchangeId: config.exchange,
          apiKey: config.apiKey,
          apiSecret: config.apiSecret,
          password: config.apiPassword,
          useTestnet: config.useTestnet,
        });

  if (config.mode === "paper") {
    const quote = config.symbol.split("/")[1] ?? "USDT";
    return new PaperAdapter(live, quote, config.paperBalance, config.risk.feeRate);
  }
  return live;
}

export type { ExchangeAdapter } from "./ExchangeAdapter.js";
