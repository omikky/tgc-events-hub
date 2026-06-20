const crypto = require("crypto");

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey() {
    const k = process.env.PAYSTACK_SECRET_KEY;
    if (!k) throw new Error("PAYSTACK_SECRET_KEY is not set");
    return k;
}

async function paystackRequest(path, options = {}) {
    const res = await fetch(`${PAYSTACK_BASE}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${secretKey()}`,
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === false) {
        throw new Error(data.message || `Paystack request failed (${res.status})`);
    }
    return data;
}

// Start a transaction; returns { authorization_url, access_code, reference }.
async function initializeTransaction({ email, amount, reference, planCode, callbackUrl, metadata }) {
    const body = { email, amount, reference, callback_url: callbackUrl, metadata };
    if (planCode) body.plan = planCode; // recurring subscription if a plan is given
    const data = await paystackRequest("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify(body),
    });
    return data.data;
}

// Confirm a transaction server-side. Returns the transaction data.
async function verifyTransaction(reference) {
    const data = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
    return data.data;
}

// Verify the X-Paystack-Signature header against the raw request body.
// Signature = HMAC-SHA512(rawBody, secretKey).
function verifyWebhookSignature(rawBody, signature) {
    if (!signature) return false;
    const expected = crypto.createHmac("sha512", secretKey()).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
    initializeTransaction,
    verifyTransaction,
    verifyWebhookSignature,
};
