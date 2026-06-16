# Deploying the bot (and using it from your phone)

This bot is a long-running background process. It needs a host that allows
**always-on processes** — that rules out Vercel/Netlify (serverless). Good
options: a small VPS, Railway, Fly.io, a Raspberry Pi, or Termux on Android.

> Start in `MODE=paper` everywhere first. Only switch to `live` after you trust
> it, and use **trade-only** API keys (never enable withdrawals).

---

## Option A — Cloud server (VPS) with pm2  ·  recommended

Best balance of control and reliability. ~$4–6/month (Hetzner, DigitalOcean,
Lightsail, Contabo).

1. Create an Ubuntu 22.04+ server. SSH in.
2. Install Node 22 and pm2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```
3. Copy the bot up (git clone, or scp the folder), then:
   ```bash
   cd trading-bot
   npm install
   cp .env.example .env
   nano .env            # set EXCHANGE, keys, MODE, risk settings
   npm test             # sanity check
   ```
4. Start it under pm2 and make it survive reboots:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup          # run the command it prints
   ```
5. Watch it from anywhere (including your phone — see "Phone" below):
   ```bash
   pm2 logs tgc-trading-bot
   pm2 status
   ```

## Option B — Railway (no server admin)

1. Push this repo to GitHub (already done).
2. On railway.app: New Project → Deploy from GitHub repo.
3. Set the service **Root Directory** to `trading-bot`. Railway detects the
   Dockerfile automatically.
4. Add environment variables (Variables tab) from `.env.example` — at minimum
   `EXCHANGE`, `MODE`, and (for live) `API_KEY`/`API_SECRET`.
5. Deploy. View logs in the Railway dashboard (works on mobile browser).

## Option C — Docker (any host)

```bash
cd trading-bot
docker build -t tgc-trading-bot .
docker run -d --name bot --restart unless-stopped --env-file .env tgc-trading-bot
docker logs -f bot
```

## Option D — Directly on an Android phone (Termux)

Runs on the phone itself. Fine for testing; for 24/7 keep the phone charging,
on Wi-Fi, and disable battery optimization for Termux.

1. Install **Termux** from F-Droid (not the outdated Play Store build).
2. In Termux:
   ```bash
   pkg update && pkg install nodejs git
   git clone <your-repo-url>
   cd tgc-events-hub/trading-bot
   npm install
   cp .env.example .env
   nano .env
   npm run bot
   ```
3. Install `termux-services` or use `tmux` so it keeps running when you close
   the app.

---

## Using it from your phone via Telegram

The bot ships with a Telegram integration in two layers. Both are off until you
add a token, so they never interfere with headless runs.

### 1. Bot commands + alerts (no public URL needed)

1. In Telegram, open **@BotFather** → `/newbot` → copy the token.
2. Put it in `.env`: `TELEGRAM_TOKEN=123456:ABC...`
3. Start the bot, then message your new bot **once**. It replies with your chat
   id. Put that in `.env` as `TELEGRAM_CHAT_ID=...` and restart.
4. You'll now get a DM on every trade (open/close/PnL, halts, errors), and can
   send commands:
   - `/status` — state, equity, today's PnL, open position
   - `/balance` · `/position`
   - `/pause` — stop opening NEW trades (open positions keep their SL/TP)
   - `/resume` · `/stop`

Only `TELEGRAM_CHAT_ID` can control the bot; other chats are refused.

### 2. Mini App dashboard (visual, opens inside Telegram)

A web dashboard with live equity/PnL/position and Pause/Resume/Stop buttons,
served by the bot and authenticated with Telegram's signed `initData`.

It needs a **public HTTPS URL**. Easiest for a VPS/home setup is a Cloudflare
Tunnel:

1. Enable it in `.env`:
   ```ini
   MINIAPP_ENABLED=true
   MINIAPP_PORT=8080
   MINIAPP_PUBLIC_URL=https://your-tunnel.example.com
   ```
2. Expose the port over HTTPS, e.g.:
   ```bash
   cloudflared tunnel --url http://localhost:8080   # prints an https URL
   # or: ngrok http 8080
   ```
   Put that https URL in `MINIAPP_PUBLIC_URL` and restart.
3. In **@BotFather** → your bot → **Bot Settings → Menu Button → set web app
   URL** to that https URL (or `/setmenubutton`). On Railway/Fly, just use the
   service's public URL instead of a tunnel.
4. Open your bot in Telegram and tap the menu button → the dashboard opens.

Security: every Mini App API call must carry a valid Telegram `initData`, and
the authenticated Telegram user must equal `TELEGRAM_CHAT_ID`, so only you can
view state or send commands.

---

## Security checklist

- API keys: **trade permission only**, withdrawals disabled.
- Keep `.env` off git (it's git-ignored) and out of Docker images.
- Restrict exchange API keys to your server's IP if the exchange supports it.
- Prove in `paper` → exchange `testnet` → small `live` capital, in that order.
