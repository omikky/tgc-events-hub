const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getSecret() {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error("JWT_SECRET is not set");
    return s;
}

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function signToken(user) {
    return jwt.sign({ sub: String(user._id), role: user.role }, getSecret(), { expiresIn: "7d" });
}

// Express middleware: require a valid Bearer token; attaches req.user.
async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) return res.status(401).json({ error: "Authentication required" });

        const payload = jwt.verify(token, getSecret());
        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ error: "Invalid token" });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

// Must be used after requireAuth.
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
}

module.exports = { hashPassword, verifyPassword, signToken, requireAuth, requireAdmin };
