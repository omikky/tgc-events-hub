const express = require("express");
const crypto = require("crypto");
const Plan = require("../models/Plan");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Settings = require("../models/Settings");
const { requireAuth } = require("../lib/auth");
const paystack = require("../lib/paystack");
const { activateOrExtend } = require("../lib/subscription");

const router = express.Router();

// POST /api/payments/paystack/initialize  { planId }
// Returns a Paystack checkout URL to redirect the user to.
router.post("/paystack/initialize", requireAuth, async (req, res) => {
    try {
        const { planId } = req.body || {};
        const plan = await Plan.findById(planId);
        if (!plan || !plan.active) return res.status(404).json({ error: "Plan not found" });

        const reference = `TGC-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
        // Record a pending payment up front; the webhook/verify will confirm it.
        await Payment.create({
            user: req.user._id,
            plan: plan._id,
            planName: plan.name,
            amount: plan.amount,
            currency: plan.currency,
            method: "paystack",
            status: "pending",
            reference,
        });

        const init = await paystack.initializeTransaction({
            email: req.user.email,
            amount: plan.amount,
            reference,
            planCode: plan.paystackPlanCode || undefined,
            callbackUrl: `${process.env.APP_URL || ""}/bot/dashboard?ref=${reference}`,
            metadata: { userId: String(req.user._id), planId: String(plan._id) },
        });

        res.json({ authorizationUrl: init.authorization_url, reference });
    } catch (err) {
        console.error("paystack init error:", err);
        res.status(500).json({ error: err.message || "Could not start payment" });
    }
});

// GET /api/payments/paystack/verify/:reference
// Lets the frontend confirm a payment immediately after redirect back.
router.get("/paystack/verify/:reference", requireAuth, async (req, res) => {
    try {
        const data = await paystack.verifyTransaction(req.params.reference);
        if (data.status === "success") {
            await fulfillPaystack(data);
            return res.json({ status: "success" });
        }
        res.json({ status: data.status });
    } catch (err) {
        console.error("paystack verify error:", err);
        res.status(500).json({ error: "Verification failed" });
    }
});

// POST /api/payments/paystack/webhook — Paystack server-to-server notifications.
// IMPORTANT: this route is mounted with a raw body parser so the signature can
// be verified. No auth middleware (Paystack is the caller); the signature is the
// authentication.
async function paystackWebhook(req, res) {
    try {
        const signature = req.headers["x-paystack-signature"];
        const rawBody = req.body; // Buffer (express.raw)
        if (!paystack.verifyWebhookSignature(rawBody, signature)) {
            return res.status(401).send("invalid signature");
        }
        const event = JSON.parse(rawBody.toString("utf8"));
        // Acknowledge fast; Paystack retries on non-2xx.
        res.sendStatus(200);

        if (event.event === "charge.success") {
            await fulfillPaystack(event.data);
        }
    } catch (err) {
        console.error("paystack webhook error:", err);
        if (!res.headersSent) res.sendStatus(500);
    }
}

// Idempotently mark a Paystack payment successful and extend the subscription.
async function fulfillPaystack(data) {
    const reference = data.reference;
    const payment = await Payment.findOne({ reference, method: "paystack" });
    if (!payment) {
        console.warn("Paystack fulfill: no matching payment for", reference);
        return;
    }
    if (payment.status === "success") return; // already processed

    payment.status = "success";
    await payment.save();

    // Capture the Paystack customer code for future recurring management.
    const customerCode = data.customer && data.customer.customer_code;
    if (customerCode) {
        await User.updateOne({ _id: payment.user }, { paystackCustomerCode: customerCode });
    }

    const plan = await Plan.findById(payment.plan);
    if (plan) {
        const subCode = data.subscription_code || (data.plan && data.plan.subscription_code);
        await activateOrExtend({
            userId: payment.user,
            plan,
            provider: "paystack",
            paystackSubscriptionCode: subCode,
        });
    }
}

// POST /api/payments/crypto/submit  { planId, asset, network, txHash }
// Records a pending crypto payment for an admin to confirm (on-chain transfers
// can't be auto-charged, so the admin verifies the tx and confirms).
router.post("/crypto/submit", requireAuth, async (req, res) => {
    try {
        const { planId, asset, network, txHash } = req.body || {};
        if (!txHash) return res.status(400).json({ error: "Transaction hash is required" });
        const plan = await Plan.findById(planId);
        if (!plan || !plan.active) return res.status(404).json({ error: "Plan not found" });

        const payment = await Payment.create({
            user: req.user._id,
            plan: plan._id,
            planName: plan.name,
            amount: plan.amount,
            currency: plan.currency,
            method: "crypto",
            status: "pending",
            cryptoAsset: asset,
            cryptoNetwork: network,
            cryptoTxHash: txHash,
            reference: txHash,
        });
        res.status(201).json({ payment, message: "Submitted. Your subscription activates once we confirm the transfer." });
    } catch (err) {
        console.error("crypto submit error:", err);
        res.status(500).json({ error: "Could not submit crypto payment" });
    }
});

// GET /api/payments/crypto/addresses — public wallet addresses to pay into.
router.get("/crypto/addresses", async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: "cryptoWallets" });
        res.json({ wallets: setting ? setting.value : [] });
    } catch (err) {
        res.status(500).json({ error: "Failed to load wallet addresses" });
    }
});

module.exports = { router, paystackWebhook };
