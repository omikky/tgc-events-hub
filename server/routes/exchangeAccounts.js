const express = require("express");
const ExchangeAccount = require("../models/ExchangeAccount");
const { requireAuth } = require("../lib/auth");
const { encrypt, last4 } = require("../lib/crypto");

const router = express.Router();

const SUPPORTED = ["binance", "bybit", "bingx", "okx", "kucoin", "kraken"];

// GET /api/exchange-accounts — the user's linked accounts (secrets never returned).
router.get("/", requireAuth, async (req, res) => {
    try {
        const accounts = await ExchangeAccount.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(accounts.map((a) => a.toSafeJSON()));
    } catch (err) {
        res.status(500).json({ error: "Failed to load accounts" });
    }
});

// POST /api/exchange-accounts  { exchange, label, apiKey, apiSecret, passphrase? }
router.post("/", requireAuth, async (req, res) => {
    try {
        const { exchange, label, apiKey, apiSecret, passphrase } = req.body || {};
        if (!exchange || !apiKey || !apiSecret) {
            return res.status(400).json({ error: "exchange, apiKey and apiSecret are required" });
        }
        if (!SUPPORTED.includes(String(exchange).toLowerCase())) {
            return res.status(400).json({ error: `Unsupported exchange. Supported: ${SUPPORTED.join(", ")}` });
        }

        const account = await ExchangeAccount.create({
            user: req.user._id,
            exchange: String(exchange).toLowerCase(),
            label: label || `${exchange} account`,
            apiKeyLast4: last4(apiKey),
            apiKeyEnc: encrypt(apiKey),
            apiSecretEnc: encrypt(apiSecret),
            apiPassphraseEnc: passphrase ? encrypt(passphrase) : undefined,
        });
        res.status(201).json(account.toSafeJSON());
    } catch (err) {
        console.error("link account error:", err);
        res.status(500).json({ error: "Failed to link account" });
    }
});

// DELETE /api/exchange-accounts/:id
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const result = await ExchangeAccount.deleteOne({ _id: req.params.id, user: req.user._id });
        if (result.deletedCount === 0) return res.status(404).json({ error: "Account not found" });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to remove account" });
    }
});

module.exports = router;
