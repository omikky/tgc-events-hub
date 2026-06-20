const mongoose = require("mongoose");

// A user's linked exchange API credentials. Secrets are stored ENCRYPTED at rest
// (AES-256-GCM, see server/lib/crypto.js) and are never returned to the client.
const exchangeAccountSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        exchange: { type: String, required: true }, // binance | bybit | bingx | ...
        label: { type: String },
        // Last 4 chars of the API key, shown to the user so they can identify it.
        apiKeyLast4: { type: String },
        // Encrypted blobs ("iv:tag:ciphertext"). Never sent to the client.
        apiKeyEnc: { type: String, required: true, select: false },
        apiSecretEnc: { type: String, required: true, select: false },
        apiPassphraseEnc: { type: String, select: false },
    },
    { timestamps: true }
);

exchangeAccountSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        exchange: this.exchange,
        label: this.label,
        apiKeyLast4: this.apiKeyLast4,
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model("ExchangeAccount", exchangeAccountSchema);
