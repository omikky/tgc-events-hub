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

## Using / monitoring it from your phone

The bot currently logs to stdout; it has no GUI yet. Phone options today:

- **SSH app** (Termius, JuiceSSH on Android; Termius, Blink on iOS): connect to
  your VPS and run `pm2 logs` / `pm2 status` / `pm2 restart tgc-trading-bot`.
- **Railway/Render dashboard** in your mobile browser shows live logs.

Best phone experience (not built yet): a **Telegram control layer** so the bot
sends you trade alerts and accepts commands like `/status`, `/pause`, `/resume`.
Ask and it can be added.

---

## Security checklist

- API keys: **trade permission only**, withdrawals disabled.
- Keep `.env` off git (it's git-ignored) and out of Docker images.
- Restrict exchange API keys to your server's IP if the exchange supports it.
- Prove in `paper` → exchange `testnet` → small `live` capital, in that order.
