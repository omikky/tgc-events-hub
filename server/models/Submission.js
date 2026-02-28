const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ["rentals", "services", "both", "client"], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    rentalDetails: {
        items: String,
        date: String,
        location: String
    },
    eventDetails: {
        eventDate: String,
        guests: String,
        vendors: String,
        location: String,
        services: [String],
        items: String,
        details: String
    },
    invoice: {
        items: [{ name: String, price: Number }],
        actualBill: Number,
        cautionFee: Number,
        logistics: Number,
        vat: Number,
        other: Number,
        total: Number
    },
    status: { type: String, enum: ["pending", "confirmed", "invoiced", "paid", "completed", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Submission", submissionSchema);
