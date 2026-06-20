// Create or promote an admin user.
// Usage: node scripts/seedAdmin.js <email> <password> [name]
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { hashPassword } = require("../lib/auth");

async function main() {
    const [email, password, name] = process.argv.slice(2);
    if (!email || !password) {
        console.error("Usage: node scripts/seedAdmin.js <email> <password> [name]");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
        user.role = "admin";
        await user.save();
        console.log(`✅ Promoted existing user ${email} to admin`);
    } else {
        user = await User.create({
            name: name || "Admin",
            email: email.toLowerCase(),
            passwordHash: await hashPassword(password),
            role: "admin",
        });
        await Subscription.create({ user: user._id, status: "inactive" });
        console.log(`✅ Created admin user ${email}`);
    }
    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
