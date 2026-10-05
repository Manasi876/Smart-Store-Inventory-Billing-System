import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            trim: true,
        },
        avatar: {
            type: String, // cloudinary url - profile picture ke liye
        },
        aadharCard: {
            type: String, // cloudinary url - sirf verification submit karte waqt aata hai
        },
        panCard: {
            type: String, // cloudinary url - sirf verification submit karte waqt aata hai
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: ["admin", "manager", "cashier", "staff", "employee"],
            default: "employee",
        },
        // Employee ka verification kis stage pe hai - staff verification workflow ke liye
        
        verificationStatus: {
            type: String,
            enum: ["not_submitted", "pending", "approved", "rejected"],
            default: "not_submitted",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true },
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
            role: this.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
};

export const User = mongoose.model("User", userSchema);
