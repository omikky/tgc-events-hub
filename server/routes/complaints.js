const express = require("express");
const Complaint = require("../models/Complaint");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

// GET /api/complaints — the user's own complaints/tickets.
router.get("/", requireAuth, async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: "Failed to load complaints" });
    }
});

// POST /api/complaints  { subject, message }
router.post("/", requireAuth, async (req, res) => {
    try {
        const { subject, message } = req.body || {};
        if (!subject || !message) return res.status(400).json({ error: "subject and message are required" });
        const complaint = await Complaint.create({ user: req.user._id, subject, message });
        res.status(201).json(complaint);
    } catch (err) {
        res.status(500).json({ error: "Failed to submit complaint" });
    }
});

module.exports = router;
