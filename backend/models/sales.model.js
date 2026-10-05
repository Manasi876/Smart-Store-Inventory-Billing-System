import mongoose, { Schema } from "mongoose";

const saleItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
        },
    },
    { _id: false },
);

const soldBySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const salesSchema = new Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        // Snapshot keeps seller information in historical invoices even if the user is deleted later.
        soldBy: {
            type: soldBySchema,
            required: true,
        },
        items: {
            type: [saleItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "At least one item is required in a sale",
            },
        },
        subTotal: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        grandTotal: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "upi", "netbanking", "wallet"],
            required: true,
            default: "cash",
        },
        payment: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
        },
        // These 3 belong to the SALE as a whole (one Razorpay order per
        // entire checkout), not to individual line items - moved here
        // from saleItemSchema, where they would have been silently
        // dropped by Mongoose's strict mode and broken verification.
        razorpayOrderId: {
            type: String,
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "partial", "refunded", "failed"],
            default: "pending",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "cancelled", "returned"],
            default: "completed",
        },
        saleDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true },
);

export const Sales = mongoose.model("Sales", salesSchema);
