const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
        planName: { type: String },
        amount: { type: Number, required: true }, // smallest currency unit
        currency: { type: String, default: "NGN" },
        method: { type: String, enum: ["paystack", "crypto"], required: true },
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending",
            index: true,
        },
        // Paystack transaction reference (unique) or crypto tx hash.
        reference: { type: String, index: true },
        // Crypto-specific fields.
        cryptoAsset: { type: String }, // e.g. USDT
        cryptoNetwork: { type: String }, // e.g. TRON (TRC20)
        cryptoTxHash: { type: String },
        // Free-form audit / admin note.
        note: { type: String },
        confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        confirmedAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
