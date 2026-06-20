const { test } = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

// Set required env BEFORE requiring the modules.
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
process.env.PAYSTACK_SECRET_KEY = "sk_test_example_secret";

const { encrypt, decrypt, last4 } = require("../lib/crypto");
const paystack = require("../lib/paystack");
const { computeDueDate } = require("../lib/subscription");
const { passwordIssue } = require("../lib/security");

test("crypto: encrypt/decrypt round-trips", () => {
    const secret = "my-super-secret-api-key-1234567890";
    const blob = encrypt(secret);
    assert.notStrictEqual(blob, secret, "ciphertext must differ from plaintext");
    assert.strictEqual(decrypt(blob), secret);
});

test("crypto: encryption is non-deterministic (random IV)", () => {
    const a = encrypt("same-value");
    const b = encrypt("same-value");
    assert.notStrictEqual(a, b, "same plaintext should produce different ciphertext");
    assert.strictEqual(decrypt(a), decrypt(b));
});

test("crypto: tampered ciphertext fails authentication", () => {
    const blob = encrypt("value");
    const [iv, tag, ct] = blob.split(":");
    const tampered = [iv, tag, Buffer.from("evil").toString("base64")].join(":");
    assert.throws(() => decrypt(tampered));
});

test("crypto: last4 masks correctly", () => {
    assert.strictEqual(last4("abcdef1234"), "1234");
    assert.strictEqual(last4("ab"), "ab");
});

test("paystack: webhook signature verification", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "r1" } });
    const good = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(body).digest("hex");
    assert.strictEqual(paystack.verifyWebhookSignature(body, good), true);
    assert.strictEqual(paystack.verifyWebhookSignature(body, "deadbeef"), false);
    assert.strictEqual(paystack.verifyWebhookSignature(body, undefined), false);
});

test("subscription: computeDueDate starts from now when expired", () => {
    const now = new Date("2026-01-01T00:00:00Z").getTime();
    const due = computeDueDate(new Date(now - 1000), 30, now);
    assert.strictEqual(due.getTime(), now + 30 * 86400000);
});

test("subscription: computeDueDate stacks onto a future due date", () => {
    const now = new Date("2026-01-01T00:00:00Z").getTime();
    const future = new Date(now + 10 * 86400000);
    const due = computeDueDate(future, 30, now);
    assert.strictEqual(due.getTime(), future.getTime() + 30 * 86400000);
});

test("security: password policy enforces length and complexity", () => {
    assert.ok(passwordIssue("short1")); // too short
    assert.ok(passwordIssue("alllettersonly")); // no digit
    assert.ok(passwordIssue("12345678")); // no letter
    assert.strictEqual(passwordIssue("Password123"), null); // valid
});
