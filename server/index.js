require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const Submission = require("./models/Submission");
const Settings = require("./models/Settings");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ CRITICAL ERROR: MONGODB_URI is not defined in environment variables!");
} else {
    // Hide password for logging
    const safeUri = MONGODB_URI.replace(/:([^@]+)@/, ":****@");
    console.log(`🔌 Attempting to connect to MongoDB: ${safeUri}`);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("✅ SUCCESS: Connected to MongoDB");
    })
    .catch(err => {
        console.error("❌ ERROR: MongoDB connection failed!");
        console.error("Reason:", err.message);
        if (err.name === 'MongoParseError') {
            console.error("Check if your connection string is formatted correctly.");
        } else if (err.message.includes('ETIMEDOUT')) {
            console.error("Connection timed out. Check IP whitelisting on MongoDB Atlas (Allow 0.0.0.0/0).");
        }
    });

// Monitor Connection State
mongoose.connection.on('error', err => {
    console.error('🔴 MongoDB Runtime Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('🟠 MongoDB disconnected. Retrying...');
});

// Email Transporter (Mock settings if not provided in .env)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const path = require("path");

// Routes
app.get("/api/settings/:key", async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key });
        res.json({ value: setting ? setting.value : "" });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch setting" });
    }
});

app.post("/api/settings/:key", async (req, res) => {
    try {
        const setting = await Settings.findOneAndUpdate(
            { key: req.params.key },
            { value: req.body.value },
            { upsert: true, new: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: "Failed to update setting" });
    }
});

app.post("/api/submissions", async (req, res) => {
    try {
        const submissionData = req.body;

        // Generate an ID if not present
        if (!submissionData.id) {
            submissionData.id = `TGC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const newSubmission = new Submission(submissionData);
        await newSubmission.save();

        // Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: `New TGC Event Submission: ${newSubmission.type}`,
            text: `New submission received from ${newSubmission.name} (${newSubmission.email}).\nType: ${newSubmission.type}\nCheck the admin dashboard for details.`,
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                } else {
                    console.log("Email sent: " + info.response);
                }
            });
        } else {
            console.log("[MOCK EMAIL LOG]: No credentials provided. Email content:", mailOptions.text);
        }

        res.status(201).json(newSubmission);
    } catch (error) {
        console.error("Submission error:", error);
        res.status(500).json({ message: "Failed to save submission", error: error.message });
    }
});

app.get("/api/submissions", async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch submissions" });
    }
});

app.patch("/api/submissions/:id", async (req, res) => {
    try {
        const { status, invoice } = req.body;

        const updateData = { status };
        if (invoice) {
            updateData.invoice = invoice;
        }

        const updated = await Submission.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Failed to update status" });
    }
});

// Serve frontend in production (Render/Vercel)
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../dist/index.html"));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
