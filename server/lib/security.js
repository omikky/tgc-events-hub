const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

// ---- Secure HTTP headers ----
// CSP is relaxed enough for the SPA + Paystack checkout redirect. Tighten the
// connect/script sources further if you self-host all assets.
const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://js.paystack.co", "https://telegram.org"],
            connectSrc: ["'self'", "https://api.paystack.co"],
            imgSrc: ["'self'", "data:", "https:"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            frameSrc: ["https://checkout.paystack.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
    // HSTS: force HTTPS for a year (only meaningful when served over TLS).
    hsts: { maxAge: 31536000, includeSubDomains: true },
});

// ---- Rate limiters (brute-force / abuse protection) ----
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // per IP per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
});

// Strict limit on auth endpoints to throttle credential stuffing.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only count failed attempts
    message: { error: "Too many attempts. Try again in 15 minutes." },
});

// Limit on payment/sensitive write endpoints.
const sensitiveLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a moment." },
});

// ---- Apply core protections to the app ----
function applySecurity(app) {
    app.disable("x-powered-by");
    app.set("trust proxy", 1); // correct client IPs behind a proxy (Render/NGINX)
    app.use(helmetMiddleware);
    app.use(generalLimiter);
    // Strip keys containing $ or . to block NoSQL operator injection.
    app.use(mongoSanitize());
    app.use(hpp());
}

// ---- CORS allowlist ----
// Only origins in ALLOWED_ORIGINS (comma-separated) may call the API from a
// browser. Falls back to APP_URL, and to "*" only in development.
function corsOptions() {
    const list = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return {
        origin(origin, cb) {
            // Allow same-origin / server-to-server (no Origin header) and webhooks.
            if (!origin) return cb(null, true);
            if (list.length === 0 && process.env.NODE_ENV !== "production") return cb(null, true);
            if (list.includes(origin)) return cb(null, true);
            return cb(new Error("Not allowed by CORS"));
        },
        credentials: true,
    };
}

// ---- Password policy ----
function passwordIssue(password) {
    const p = String(password || "");
    if (p.length < 8) return "Password must be at least 8 characters";
    if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) return "Password must include letters and numbers";
    return null;
}

// ---- Startup secret validation ----
// Refuse to start in production without strong secrets, so the app is never
// deployed with default/weak keys.
function validateSecrets() {
    const problems = [];
    const required = ["JWT_SECRET", "ENCRYPTION_KEY", "MONGODB_URI"];
    for (const key of required) {
        if (!process.env[key]) problems.push(`${key} is not set`);
    }
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 24) {
        problems.push("JWT_SECRET is too short (use 32+ random chars)");
    }
    if (problems.length) {
        const msg = "SECURITY: " + problems.join("; ");
        if (process.env.NODE_ENV === "production") {
            throw new Error(msg + " — refusing to start.");
        }
        console.warn("⚠️  " + msg + " (allowed in non-production)");
    }
}

module.exports = {
    applySecurity,
    corsOptions,
    authLimiter,
    sensitiveLimiter,
    passwordIssue,
    validateSecrets,
};
