# Quick Start — switch the bot on (clear, step by step)

Follow this top to bottom. It takes ~10 minutes. You will **not** risk any real
money — the bot starts in paper (simulated) mode.

There are 3 parts:
- **Part 1** — get the bot running (proves it works).
- **Part 2** — control it from your phone with Telegram commands.
- **Part 3** — (optional) the visual Mini App dashboard.

---

## Part 1 — Get the bot running (paper mode)

### Step 1.1 — Install Node.js (one time)
You need Node 20 or newer. Check what you have:
```bash
node -v
```
- If it prints `v20…`, `v22…` or higher → good, skip ahead.
- If it says "command not found" → install it from https://nodejs.org (the
  "LTS" button), then re-open your terminal and run `node -v` again.

### Step 1.2 — Open the bot folder
Unzip the file I sent, then in your terminal go INTO the `trading-bot` folder:
```bash
cd path/to/trading-bot
```
(Tip: type `cd ` with a space, then drag the `trading-bot` folder into the
terminal window, then press Enter.)

You're in the right place if this command lists files like `package.json`:
```bash
ls
```

### Step 1.3 — Install the bot's parts (one time)
```bash
npm install
```
Wait for it to finish (about a minute).

### Step 1.4 — Create your settings file
```bash
cp .env.example .env
```
That's it — the defaults are already safe paper mode. You don't need to edit
anything yet.

### Step 1.5 — Start it
```bash
npm run bot
```

✅ **Success looks like this** — you'll see lines like:
```
INFO  TGC Trading Bot
INFO  paper trading — simulated fills, no real money
INFO  Bot initialised {"exchange":"binance","mode":"paper",...}
```
It's now watching the market. Leave this window open. To stop it, press
`Ctrl + C`.

> If you see a network/"403" error, your internet or firewall is blocking the
> exchange. Try a different network, or run it on a cloud server (see
> DEPLOY.md).

**You now have a working bot.** Parts 2 and 3 add phone control.

---

## Part 2 — Control it from your phone (Telegram commands)

This lets the bot message you on every trade and lets you type commands like
`/status` from your phone. No website or hosting needed.

### Step 2.1 — Create your Telegram bot
1. Open Telegram and search for **@BotFather** (the one with the blue tick).
2. Send it: `/newbot`
3. It asks for a name → type anything, e.g. `My Trading Bot`.
4. It asks for a username → must end in `bot`, e.g. `my_trading_9421_bot`.
5. BotFather replies with a **token** that looks like:
   `8123456789:AAH9x...long...string`. **Copy it.**

### Step 2.2 — Put the token in your settings
Open the `.env` file (any text editor) and find this line:
```ini
TELEGRAM_TOKEN=
```
Paste your token right after the `=`, no spaces:
```ini
TELEGRAM_TOKEN=8123456789:AAH9x...long...string
```
Save the file.

### Step 2.3 — Restart the bot
In the terminal, press `Ctrl + C` to stop it, then start it again:
```bash
npm run bot
```
You should now also see: `Telegram connected as @your_bot_name`.

### Step 2.4 — Get your chat id (the important bit)
1. In Telegram, **open YOUR new bot** (search its username, tap it, press
   **Start**).
2. Send it any message, e.g. `hi`.
3. The bot replies with something like:
   > Your chat id is `123456789`. Set `TELEGRAM_CHAT_ID=123456789` in .env and
   > restart to enable control.
4. **Copy that number.**

### Step 2.5 — Lock control to you
Open `.env` again, find:
```ini
TELEGRAM_CHAT_ID=
```
Put your number after the `=`:
```ini
TELEGRAM_CHAT_ID=123456789
```
Save, then restart the bot one more time (`Ctrl + C`, then `npm run bot`).

✅ **Done.** In Telegram, send your bot `/status`. You should get a live reply.
You'll also get a DM automatically whenever the bot opens or closes a trade.

### Commands you can send
| Command | What it does |
| --- | --- |
| `/status` | State, equity, today's P&L, open position |
| `/balance` | Your account equity |
| `/position` | Details of the open position |
| `/pause` | Stop opening NEW trades (open ones keep their stop-loss/take-profit) |
| `/resume` | Allow new trades again |
| `/stop` | Stop the bot loop |
| `/help` | List of commands |

---

## Part 3 — (Optional) The visual dashboard inside Telegram

Skip this unless you want a tap-friendly screen with buttons. It needs a public
web address, so it's a bit more setup. Full instructions are in **DEPLOY.md**
under "Mini App dashboard". Short version:

1. In `.env` set:
   ```ini
   MINIAPP_ENABLED=true
   MINIAPP_PORT=8080
   ```
2. Make the port reachable over HTTPS (free, one command):
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```
   It prints an `https://…` address. Copy it into `.env`:
   ```ini
   MINIAPP_PUBLIC_URL=https://that-address-you-copied
   ```
3. Restart the bot.
4. In **@BotFather**: send `/setmenubutton`, pick your bot, and paste the same
   `https://…` address.
5. Open your bot in Telegram → tap the menu button → the dashboard opens.

---

## Going from "practice" to real money (only when you're ready)

Stay in paper mode until you trust it. When you decide to go live:

1. On your exchange, create API keys with **trade permission only** — leave
   **withdrawals disabled**.
2. In `.env`, paste them and switch modes:
   ```ini
   EXCHANGE=bybit          # or binance, bingx
   API_KEY=your_key
   API_SECRET=your_secret
   USE_TESTNET=true        # try the practice network first
   MODE=live
   ```
3. Test on the exchange's testnet, then set `USE_TESTNET=false` and start with
   the **smallest** amount the exchange allows.

Reminder: no bot guarantees profit, and scalping needs more than a few dollars
to work (exchange minimum order sizes + fees). Start small.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `node: command not found` | Install Node.js (Step 1.1), reopen terminal. |
| `npm: command not found` | Same — Node installs npm too. |
| Bot starts but Telegram silent | Re-check `TELEGRAM_TOKEN` (Step 2.2) and that you pressed **Start** in the chat. |
| `/status` says "Not authorized" | Your `TELEGRAM_CHAT_ID` doesn't match. Redo Steps 2.4–2.5. |
| Network / 403 error on start | Internet/firewall blocks the exchange; try another network or a cloud server (DEPLOY.md). |
| Want it running 24/7 | Use a cheap cloud server with pm2 — see DEPLOY.md. |
