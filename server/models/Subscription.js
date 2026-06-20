const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
        planName: { type: String },
        status: {
            type: String,
            enum: ["inactive", "active", "expired", "cancelled"],
            default: "inactive",
        },
        // When the current paid period started / ends (the "due date").
        startedAt: { type: Date },
        dueDate: { type: Date },
        provider: { type: String, enum: ["paystack", "crypto", "manual", null], default: null },
        // Paystack subscription code, if recurring auto-billing is set up.
        paystackSubscriptionCode: { type: String },
        cancelledAt: { type: Date },
    },
    { timestamps: true }
);

// True only if active AND the due date is still in the future.
subscriptionSchema.methods.isCurrentlyActive = function () {
    return this.status === "active" && this.dueDate && this.dueDate.getTime() > Date.now();
};

module.exports = mongoose.model("Subscription", subscriptionSchema);
