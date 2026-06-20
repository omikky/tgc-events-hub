const express = require("express");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const Payment = require("../models/Payment");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

// GET /api/plans — public list of active plans (used by the pricing page).
router.get("/plans", async (req, res) => {
    try {
        const plans = await Plan.find({ active: true }).sort({ amount: 1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: "Failed to load plans" });
    }
});

// GET /api/subscription — the current user's subscription + recent payments.
router.get("/subscription", requireAuth, async (req, res) => {
    try {
        const sub = await Subscription.findOne({ user: req.user._id }).populate("plan");
        const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
        res.json({
            subscription: sub,
            active: sub ? sub.isCurrentlyActive() : false,
            payments,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load subscription" });
    }
});

// POST /api/subscription/cancel — stop auto-renew; access remains until due date.
router.post("/subscription/cancel", requireAuth, async (req, res) => {
    try {
        const sub = await Subscription.findOne({ user: req.user._id });
        if (!sub) return res.status(404).json({ error: "No subscription found" });
        sub.status = sub.isCurrentlyActive() ? "active" : "cancelled";
        sub.cancelledAt = new Date();
        // Note: cancelling auto-renew with Paystack also requires disabling the
        // Paystack subscription via their API; tracked for the recurring phase.
        await sub.save();
        res.json({ subscription: sub, message: "Auto-renew cancelled. Access continues until the due date." });
    } catch (err) {
        res.status(500).json({ error: "Failed to cancel subscription" });
    }
});

module.exports = router;
