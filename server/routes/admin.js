const express = require("express");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Plan = require("../models/Plan");
const Complaint = require("../models/Complaint");
const Settings = require("../models/Settings");
const { requireAuth, requireAdmin } = require("../lib/auth");
const { activateOrExtend } = require("../lib/subscription");

const router = express.Router();

// All admin routes require an authenticated admin.
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats — quick dashboard summary.
router.get("/stats", async (req, res) => {
    try {
        const [users, activeSubs, pendingPayments, openComplaints] = await Promise.all([
            User.countDocuments({ role: "user" }),
            Subscription.countDocuments({ status: "active", dueDate: { $gt: new Date() } }),
            Payment.countDocuments({ status: "pending" }),
            Complaint.countDocuments({ status: "open" }),
        ]);
        const successful = await Payment.aggregate([
            { $match: { status: "success" } },
            { $group: { _id: "$currency", total: { $sum: "$amount" } } },
        ]);
        res.json({ users, activeSubs, pendingPayments, openComplaints, revenue: successful });
    } catch (err) {
        res.status(500).json({ error: "Failed to load stats" });
    }
});

// GET /api/admin/subscribers — users with their subscription summary.
router.get("/subscribers", async (req, res) => {
    try {
        const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
        const subs = await Subscription.find({ user: { $in: users.map((u) => u._id) } });
        const byUser = new Map(subs.map((s) => [String(s.user), s]));
        res.json(
            users.map((u) => ({
                ...u.toSafeJSON(),
                subscription: byUser.get(String(u._id)) || null,
            }))
        );
    } catch (err) {
        res.status(500).json({ error: "Failed to load subscribers" });
    }
});

// GET /api/admin/subscribers/:id — full detail for one subscriber.
router.get("/subscribers/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        const [subscription, payments, complaints] = await Promise.all([
            Subscription.findOne({ user: user._id }).populate("plan"),
            Payment.find({ user: user._id }).sort({ createdAt: -1 }),
            Complaint.find({ user: user._id }).sort({ createdAt: -1 }),
        ]);
        res.json({ user: user.toSafeJSON(), subscription, payments, complaints });
    } catch (err) {
        res.status(500).json({ error: "Failed to load subscriber" });
    }
});

// GET /api/admin/payments?status=pending
router.get("/payments", async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        const payments = await Payment.find(filter).populate("user", "name email").sort({ createdAt: -1 }).limit(500);
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: "Failed to load payments" });
    }
});

// POST /api/admin/payments/:id/confirm — confirm a (crypto) payment and extend access.
router.post("/payments/:id/confirm", async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ error: "Payment not found" });
        if (payment.status === "success") return res.json({ payment, message: "Already confirmed" });

        payment.status = "success";
        payment.confirmedBy = req.user._id;
        payment.confirmedAt = new Date();
        if (req.body && req.body.note) payment.note = req.body.note;
        await payment.save();

        const plan = await Plan.findById(payment.plan);
        if (plan) {
            await activateOrExtend({ userId: payment.user, plan, provider: payment.method });
        }
        res.json({ payment, message: "Payment confirmed and subscription extended" });
    } catch (err) {
        res.status(500).json({ error: "Failed to confirm payment" });
    }
});

// POST /api/admin/payments/:id/reject
router.post("/payments/:id/reject", async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status: "failed", note: (req.body && req.body.note) || "Rejected by admin" },
            { new: true }
        );
        if (!payment) return res.status(404).json({ error: "Payment not found" });
        res.json({ payment });
    } catch (err) {
        res.status(500).json({ error: "Failed to reject payment" });
    }
});

// ---- Plans CRUD ----
router.get("/plans", async (req, res) => {
    res.json(await Plan.find().sort({ amount: 1 }));
});
router.post("/plans", async (req, res) => {
    try {
        const plan = await Plan.create(req.body || {});
        res.status(201).json(plan);
    } catch (err) {
        res.status(400).json({ error: "Failed to create plan", detail: err.message });
    }
});
router.patch("/plans/:id", async (req, res) => {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json(plan);
});
router.delete("/plans/:id", async (req, res) => {
    await Plan.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ ok: true });
});

// ---- Payment settings (wallet addresses, bank details, instructions) ----
// Stored in the existing Settings key/value collection.
router.get("/settings/:key", async (req, res) => {
    const s = await Settings.findOne({ key: req.params.key });
    res.json({ key: req.params.key, value: s ? s.value : null });
});
router.put("/settings/:key", async (req, res) => {
    const s = await Settings.findOneAndUpdate(
        { key: req.params.key },
        { value: req.body.value },
        { upsert: true, new: true }
    );
    res.json(s);
});

// ---- Complaints ----
router.get("/complaints", async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const complaints = await Complaint.find(filter).populate("user", "name email").sort({ createdAt: -1 });
    res.json(complaints);
});
router.post("/complaints/:id/respond", async (req, res) => {
    try {
        const { response, resolve } = req.body || {};
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                adminResponse: response,
                respondedBy: req.user._id,
                respondedAt: new Date(),
                ...(resolve ? { status: "resolved" } : {}),
            },
            { new: true }
        );
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ error: "Failed to respond" });
    }
});

module.exports = router;
