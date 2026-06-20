const express = require("express");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { hashPassword, verifyPassword, signToken, requireAuth } = require("../lib/auth");
const { passwordIssue } = require("../lib/security");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, phone, password } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ error: "name, email and password are required" });
        }
        const pwIssue = passwordIssue(password);
        if (pwIssue) return res.status(400).json({ error: pwIssue });
        const existing = await User.findOne({ email: String(email).toLowerCase() });
        if (existing) return res.status(409).json({ error: "An account with this email already exists" });

        // The configured ADMIN_EMAIL is granted the admin role on signup.
        const role =
            process.env.ADMIN_EMAIL && String(email).toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
                ? "admin"
                : "user";

        const user = await User.create({
            name,
            email: String(email).toLowerCase(),
            phone,
            passwordHash: await hashPassword(password),
            role,
        });
        // Create an empty subscription record so the dashboard has something to show.
        await Subscription.create({ user: user._id, status: "inactive" });

        const token = signToken(user);
        res.status(201).json({ token, user: user.toSafeJSON() });
    } catch (err) {
        console.error("register error:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: "email and password are required" });

        const user = await User.findOne({ email: String(email).toLowerCase() });
        // Always do the same generic failure to avoid leaking which emails exist.
        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        if (user.isLocked()) {
            return res.status(429).json({ error: "Account temporarily locked due to failed attempts. Try again later." });
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
            await user.registerFailedLogin();
            return res.status(401).json({ error: "Invalid email or password" });
        }

        await user.resetLoginAttempts();
        const token = signToken(user);
        res.json({ token, user: user.toSafeJSON() });
    } catch (err) {
        console.error("login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
    res.json({ user: req.user.toSafeJSON() });
});

module.exports = router;
