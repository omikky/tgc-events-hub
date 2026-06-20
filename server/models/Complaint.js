const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        subject: { type: String, required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
        adminResponse: { type: String },
        respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        respondedAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
