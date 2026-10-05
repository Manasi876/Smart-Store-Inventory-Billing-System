import mongoose, { Schema } from "mongoose";

/*
  Payment model - one document per ONLINE payment attempt against a Sale.

  Cash sales never create a Payment record here - there's nothing to
  reconcile with a gateway for cash. This exists purely as an audit
  trail / reconciliation target for Razorpay; the Sale document itself
  remains the single source of truth for what was actually sold.
*/
const paymentSchema = new Schema(
    {
        sale: {
            type: Schema.Types.ObjectId,
            ref: "Sales",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["upi", "card", "netbanking", "wallet"],
            required: true,
        },
        razorpayOrderId: {
            type: String,
            required: true,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },
        status: {
            type: String,
            enum: ["created", "captured", "failed"],
            default: "created",
        },
        paidAt: {
            type: Date,
        },
    },
    { timestamps: true },
);

export const Payment = mongoose.model("Payment", paymentSchema);