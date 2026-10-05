import mongoose, { Schema } from "mongoose";

const employeeSchema = new Schema(
    {
        employeeId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User", // agar isko login access diya gaya hai
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        designation: {
            type: String,
            enum: [
                "cashier",
                "manager",
                "stock-keeper",
                "sales-associate",
                "admin",
            ],
            default: "cashier",
        },
        department: {
            type: String,
            trim: true,
        },
        salary: {
            type: Number,
            min: 0,
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        shift: {
            type: String,
            enum: ["morning", "evening", "night", "general"],
            default: "general",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export const Employee = mongoose.model("Employee", employeeSchema);
