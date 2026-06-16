# TGC Trading Bot

A modular, multi-exchange crypto trading bot with real risk management. It can
link to **Binance, Bybit, BingX**, and 100+ other exchanges through a single
adapter (powered by [ccxt](https://github.com/ccxt/ccxt)), runs a configurable
**scalping** strategy, and **automatically takes profit / cuts losses**.

> **Default mode is paper trading** — it runs the full strategy against live
> market data but simulates fills, so no real money is at risk until you
> explicitly switch to live mode.

---

## ⚠️ Read this before you use it

This is software, not a money machine. Please internalise the following — they
are facts about markets and exchanges, not pessimism:

- **No bot guarantees profit.** Anyone (including any product) claiming
  guaranteed or "perfect" returns is misleading you. This bot manages risk; it
  does not predict the future.
- **You can lose money, including with bugs or bad market conditions.** Start in
  `paper` mode, then on an exchange **testnet**, with money you can afford to
  lose.
- **$5 is not enough to scalp.** Exchanges enforce a minimum order value
  (typically ~$5–10). Scalping means many trades, and each pays fees
  (~0.075–0.1% per side) plus spread. On a tiny balance, fees alone will
  usually exceed any edge — the risk manager will (correctly) refuse trades
  whose size falls below the exchange minimum. A few hundred USDT is a realistic
  floor for this style.
- **Use API keys with _trade_ permission only — never enable withdrawals.**

## Architecture

Everything is wired through interfaces, so each layer is swappable and testable.

```
src/
  config.ts            Loads & validates .env
  types.ts             Shared domain types
  exchanges/
    ExchangeAdapter.ts The interface every exchange implements
    CcxtAdapter.ts     Universal live adapter (binance/bybit/bingx/...)
    PaperAdapter.ts    Simulated fills over live data (default mode)
    index.ts           Factory: picks live vs paper
  strategies/
    Strategy.ts        Strategy interface (pure decision function)
    ScalpingStrategy.ts EMA-trend + RSI-pullback scalper
    index.ts           Strategy registry
  risk/
    RiskManager.ts     Position sizing, stop/target, daily drawdown breaker
  core/
    TradingBot.ts      The orchestration loop
    Position.ts        Open-position model + PnL
  utils/               Logger + indicator helpers
tests/                 Vitest unit tests for risk & strategy
```

**Add an exchange:** for any ccxt-supported venue, just set `EXCHANGE=<id>`.
For something exotic, implement `ExchangeAdapter`.

**Add a strategy:** implement the `Strategy` interface and register it in
`strategies/index.ts`, then set `STRATEGY=<name>`.

## How the strategy works

A long-only "buy the dip in an uptrend" scalper. Trend and entry-timing are
measured on **different horizons** on purpose — a fast trend filter would flip
bearish on the very dip that makes RSI oversold, so the two could never align:

- **Trend filter:** price above a slow **EMA(50)** → the larger move is still up.
- **Entry:** RSI(14) dips to/below ~35 → a short-term pullback to buy into.
  Enter when trend is up **and** RSI is oversold.
- **Soft exit:** RSI overbought (≥70), or price closes back below the EMA(50)
  (uptrend broken).
- **Hard exit (always wins):** the RiskManager's stop-loss / take-profit prices,
  checked before any strategy logic each tick.

## How risk management works

- **Position size** is derived from risk, not gut feel:
  `amount = (equity × riskPerTrade) ÷ (entry − stopLoss)`. Hitting the stop
  costs ~`riskPerTrade` of equity regardless of volatility.
- **Auto take-profit & stop-loss** prices are set at entry and enforced every
  tick.
- **Daily drawdown circuit-breaker** halts new entries once the day's loss
  exceeds `MAX_DAILY_DRAWDOWN`.
- **Exchange minimums** are respected — undersized trades are vetoed rather than
  silently failing.

## Setup

Requires Node 20+ (or Bun).

```bash
cd trading-bot
npm install          # or: bun install
cp .env.example .env # then edit .env
```

### Configure `.env`

Start safe — the defaults are already paper mode:

```ini
EXCHANGE=binance
MODE=paper
PAPER_BALANCE=1000
SYMBOL=BTC/USDT
TIMEFRAME=1m
STRATEGY=scalping
RISK_PER_TRADE=0.01
STOP_LOSS_PCT=0.005
TAKE_PROFIT_PCT=0.01
MAX_DAILY_DRAWDOWN=0.05
```

## Run

```bash
npm run bot     # start the bot (paper by default)
npm test        # run the unit tests
npm run typecheck
```

### Going live (only after you trust it)

1. Prove it in `paper` mode for a meaningful period.
2. Create **trade-only** API keys on your exchange (no withdrawal permission).
3. Set `USE_TESTNET=true` and run against the exchange testnet first.
4. Only then set `MODE=live` and `USE_TESTNET=false`, starting with the
   smallest capital the exchange allows.

## Roadmap ideas

- Short-side / futures support and leverage-aware sizing
- Trailing stops and partial take-profits
- A backtester over historical OHLCV
- Persistence (so positions survive restarts) + a small dashboard

## Disclaimer

For educational purposes. Not financial advice. Trading cryptocurrencies
carries substantial risk of loss. You are solely responsible for any use of
this software and any resulting gains or losses.
