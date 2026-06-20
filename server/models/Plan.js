const mongoose = require("mongoose");

// A subscription plan the admin can offer (e.g. "Monthly", "Quarterly").
const planSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        // Price in the smallest currency unit (kobo for NGN) — Paystack expects this.
        amount: { type: Number, required: true },
        currency: { type: String, default: "NGN" },
        // Billing interval in days, used to compute the due date.
        intervalDays: { type: Number, default: 30 },
        // Optional Paystack plan code for true recurring (auto-charge) billing.
        paystackPlanCode: { type: String },
        description: { type: String },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
