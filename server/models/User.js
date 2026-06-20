const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        phone: { type: String, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        // Paystack customer code, set after first transaction (for recurring billing).
        paystackCustomerCode: { type: String },
        // Brute-force protection: lock the account after repeated failed logins.
        failedLoginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date },
    },
    { timestamps: true }
);

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

userSchema.methods.isLocked = function () {
    return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

userSchema.methods.registerFailedLogin = async function () {
    // If a previous lock has expired, reset the counter first.
    if (this.lockUntil && this.lockUntil.getTime() <= Date.now()) {
        this.failedLoginAttempts = 1;
        this.lockUntil = undefined;
    } else {
        this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
        if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
            this.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        }
    }
    await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
    if (this.failedLoginAttempts || this.lockUntil) {
        this.failedLoginAttempts = 0;
        this.lockUntil = undefined;
        await this.save();
    }
};

// Never leak the password hash in API responses.
userSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        role: this.role,
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model("User", userSchema);
