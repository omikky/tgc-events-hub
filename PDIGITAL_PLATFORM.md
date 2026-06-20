# PDigital Trading Bot — Subscription Platform

A web platform where users register, **subscribe and pay** for the trading bot,
link their exchange accounts, and track their subscription & due date — plus an
**admin backend** to manage subscribers, payments, plans, payment details and
complaints.

It is built on the existing Express + MongoDB backend and React (Vite) frontend,
and is **not tied to Vercel** — deploy it to any host that runs a Node server
(Render, Railway, a VPS, etc.); the Express server serves the built frontend.

## Routes (frontend)

| Path | Who | Purpose |
| --- | --- | --- |
| `/bot` | public | Landing + pricing |
| `/bot/register`, `/bot/login` | public | Account creation / sign in |
| `/bot/dashboard` | user | Subscription status & due date, subscribe (Paystack/crypto), link exchange accounts, payments, support tickets |
| `/bot/admin` | admin | Subscribers, payments (confirm/reject), plans, payment settings, complaints |

> The events-hub pages (`/`, `/booking`, …) are untouched and run alongside.

## Payments

- **Paystack** (cards, bank, USSD) — hosted checkout, server-side verification,
  and a signed webhook (`/api/payments/paystack/webhook`) that activates/extends
  the subscription. Recurring auto-renew works when a plan has a Paystack plan
  code.
- **Crypto** — admin configures wallet addresses; the user pays and submits the
  transaction hash; the admin confirms it in the dashboard, which extends the
  subscription. (On-chain transfers can't be auto-charged, so each crypto
  payment is period-based.)

## Security hardening

Defense-in-depth protecting both subscribers and admin. (No system is ever 100%
"unhackable" — these are the industry-standard protections that stop real
attacks.)

- **Passwords**: bcrypt-hashed; policy enforces length + complexity.
- **Auth**: JWT (7-day expiry); generic login errors (no user enumeration).
- **Brute-force**: per-account lockout after 5 failed logins (15 min) **and**
  IP rate-limiting on `/api/auth` (10 failed/15 min).
- **Exchange API keys**: encrypted at rest with **AES-256-GCM**; never returned
  to the client (only the last 4 chars are shown). Authenticated request bodies
  are size-capped.
- **Injection**: `express-mongo-sanitize` strips `$`/`.` operators (NoSQL
  injection); `hpp` blocks parameter pollution.
- **Headers**: `helmet` (CSP, HSTS, X-Frame-Options, etc.).
- **CORS**: locked to an allowlist (`ALLOWED_ORIGINS`).
- **Webhooks**: Paystack signature verified (HMAC-SHA512) before any action.
- **Secrets**: app refuses to start in production without strong
  `JWT_SECRET` / `ENCRYPTION_KEY` / `MONGODB_URI`.
- **Errors**: centralised handler returns generic messages — no stack traces.

### Your operational responsibilities
- Serve everything over **HTTPS** (so HSTS/secure cookies apply).
- Keep `.env` secret; rotate keys if exposed. **Losing `ENCRYPTION_KEY` makes
  stored exchange keys unrecoverable** — back it up securely.
- Tell users to create exchange API keys with **trade-only** permission (no
  withdrawals) and IP-restrict them where possible.
- Restrict MongoDB Atlas network access; enable 2FA on Paystack & Atlas.

## Setup

```bash
# Backend
cd server
cp .env.example .env     # fill in JWT_SECRET, ENCRYPTION_KEY, MONGODB_URI, Paystack keys, ADMIN_EMAIL
npm install
npm test                 # security/payment unit tests
npm run dev              # or: npm start

# Frontend (repo root)
npm install
npm run dev              # dev server (calls http://localhost:5000/api)
```

Create your admin account: either register with the email set in `ADMIN_EMAIL`,
or run `cd server && npm run seed-admin you@example.com 'YourStrongPass1'`.

## Deploy (no Vercel)

1. Set `NODE_ENV=production` and all env vars on your host (Render/Railway/VPS).
2. Build the frontend: `npm run build` (outputs `dist/`).
3. Start the server: `cd server && npm start` — it serves `dist/` and the API.
4. Point your domain at the host; ensure HTTPS (the platform sets HSTS).
5. In the Paystack dashboard, set the webhook URL to
   `https://your-domain.com/api/payments/paystack/webhook`.

## API summary

```
POST /api/auth/register | /api/auth/login        GET /api/auth/me
GET  /api/plans                                   GET /api/subscription
POST /api/payments/paystack/initialize           GET /api/payments/paystack/verify/:ref
POST /api/payments/paystack/webhook (Paystack)   POST /api/payments/crypto/submit
GET/POST/DELETE /api/exchange-accounts            GET/POST /api/complaints
GET  /api/admin/stats | /subscribers | /payments  POST /api/admin/payments/:id/confirm|reject
GET/POST/PATCH/DELETE /api/admin/plans            GET/PUT /api/admin/settings/:key
GET  /api/admin/complaints                        POST /api/admin/complaints/:id/respond
```
