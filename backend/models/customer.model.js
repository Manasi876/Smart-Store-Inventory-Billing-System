import mongoose, { Schema } from "mongoose";

const customerSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
            index: true,
        },
        address: {
            type: String,
            trim: true,
        },
        customerType: {
            type: String,
            enum: ["walk-in", "regular", "wholesale"],
            default: "walk-in",
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true, // wholesale customers ke liye zaroori ho sakta hai
        },
        loyaltyPoints: {
            type: Number,
            default: 0,
        },
        totalPurchases: {
            type: Number,
            default: 0, // lifetime spend track karne ke liye
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export const Customer = mongoose.model("Customer", customerSchema);
