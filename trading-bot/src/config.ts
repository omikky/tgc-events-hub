import "dotenv/config";

export type Mode = "paper" | "live";

export interface RiskConfig {
  riskPerTrade: number;
  stopLossPct: number;
  takeProfitPct: number;
  maxOpenPositions: number;
  maxDailyDrawdown: number;
  feeRate: number;
}

export interface TelegramConfig {
  enabled: boolean;
  token: string;
  /** Authorized chat id. Only this chat may issue commands / receive alerts. */
  chatId: string;
}

export interface MiniAppConfig {
  enabled: boolean;
  port: number;
  /** Public https URL where the Mini App is reachable (for BotFather/menu button). */
  publicUrl: string;
}

export interface BotConfig {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  apiPassword?: string;
  useTestnet: boolean;
  mode: Mode;
  paperBalance: number;
  symbol: string;
  timeframe: string;
  strategy: string;
  pollIntervalSeconds: number;
  risk: RiskConfig;
  telegram: TelegramConfig;
  miniApp: MiniAppConfig;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) throw new Error(`Env var ${name} must be a number, got "${raw}"`);
  return parsed;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw.toLowerCase() === "true" || raw === "1";
}

export function loadConfig(): BotConfig {
  const mode = (process.env.MODE ?? "paper").toLowerCase() as Mode;
  if (mode !== "paper" && mode !== "live") {
    throw new Error(`MODE must be "paper" or "live", got "${mode}"`);
  }

  const config: BotConfig = {
    exchange: (process.env.EXCHANGE ?? "binance").toLowerCase(),
    apiKey: process.env.API_KEY ?? "",
    apiSecret: process.env.API_SECRET ?? "",
    apiPassword: process.env.API_PASSWORD || undefined,
    useTestnet: bool("USE_TESTNET", true),
    mode,
    paperBalance: num("PAPER_BALANCE", 1000),
    symbol: process.env.SYMBOL ?? "BTC/USDT",
    timeframe: process.env.TIMEFRAME ?? "1m",
    strategy: (process.env.STRATEGY ?? "scalping").toLowerCase(),
    pollIntervalSeconds: num("POLL_INTERVAL_SECONDS", 15),
    risk: {
      riskPerTrade: num("RISK_PER_TRADE", 0.01),
      stopLossPct: num("STOP_LOSS_PCT", 0.005),
      takeProfitPct: num("TAKE_PROFIT_PCT", 0.01),
      maxOpenPositions: num("MAX_OPEN_POSITIONS", 1),
      maxDailyDrawdown: num("MAX_DAILY_DRAWDOWN", 0.05),
      feeRate: num("FEE_RATE", 0.001),
    },
    telegram: {
      token: process.env.TELEGRAM_TOKEN ?? "",
      chatId: process.env.TELEGRAM_CHAT_ID ?? "",
      enabled: Boolean(process.env.TELEGRAM_TOKEN),
    },
    miniApp: {
      port: num("MINIAPP_PORT", 8080),
      publicUrl: process.env.MINIAPP_PUBLIC_URL ?? "",
      enabled: bool("MINIAPP_ENABLED", false),
    },
  };

  // Live mode requires real credentials; paper mode does not.
  if (config.mode === "live" && (!config.apiKey || !config.apiSecret)) {
    throw new Error("Live mode requires API_KEY and API_SECRET to be set in .env");
  }

  return config;
}
