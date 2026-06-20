const crypto = require("crypto");

// AES-256-GCM encryption for sensitive data (exchange API keys) at rest.
// The key comes from ENCRYPTION_KEY: 32 bytes, provided as 64 hex chars or
// base64. Generate one with:  openssl rand -hex 32
function getKey() {
    const raw = process.env.ENCRYPTION_KEY;
    if (!raw) {
        throw new Error("ENCRYPTION_KEY is not set — cannot encrypt/decrypt secrets.");
    }
    let key;
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
        key = Buffer.from(raw, "hex");
    } else {
        key = Buffer.from(raw, "base64");
    }
    if (key.length !== 32) {
        throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes (e.g. `openssl rand -hex 32`).");
    }
    return key;
}

// Returns "iv:tag:ciphertext", all base64.
function encrypt(plaintext) {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ct = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}

function decrypt(blob) {
    const key = getKey();
    const [ivB64, tagB64, ctB64] = String(blob).split(":");
    if (!ivB64 || !tagB64 || !ctB64) throw new Error("Malformed ciphertext");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]);
    return pt.toString("utf8");
}

function last4(s) {
    const str = String(s);
    return str.length <= 4 ? str : str.slice(-4);
}

module.exports = { encrypt, decrypt, last4 };
