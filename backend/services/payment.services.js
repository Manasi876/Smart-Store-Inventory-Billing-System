import { ApiError } from "../utils/ApiError.js";
import { Sales } from "../models/sales.model.js";
import { Payment } from "../models/payment.model.js";
import {
    createRazorpayOrder,
    verifyPaymentSignature,
} from "../utils/razorpayClient.js";

/*
  initiateOnlinePayment - called right after a non-cash Sale has already
  been created and committed (see sales.services.js). Creates the actual
  Razorpay Order - deliberately kept OUTSIDE the sale's own DB
  transaction, since this is a slow external network call and should
  never hold a database transaction open. Records a Payment attempt,
  and attaches the order ID back onto the Sale so the frontend can open
  Razorpay Checkout.
*/
const initiateOnlinePayment = async (sale) => {
    const order = await createRazorpayOrder({
        amountInRupees: sale.grandTotal,
        receipt: sale.invoiceNumber,
    });

    await Payment.create({
        sale: sale._id,
        amount: sale.grandTotal,
        paymentMethod: sale.paymentMethod,
        razorpayOrderId: order.id,
        status: "created",
    });

    sale.razorpayOrderId = order.id;
    await sale.save({ validateBeforeSave: false });

    return {
        razorpayOrderId: order.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID, // public key - safe to expose to the frontend
        amount: order.amount,
        currency: order.currency,
    };
};

/*
  verifyPaymentService - called by the frontend the moment Razorpay
  Checkout's own success handler fires. This is the ONLY place a sale
  actually gets marked "paid" for online methods - we never trust the
  frontend's word for it without this signature check passing first.
*/
const verifyPaymentService = async ({
    saleId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
}) => {
    const sale = await Sales.findById(saleId);
    if (!sale) {
        throw new ApiError(404, "Sale not found");
    }

    if (sale.razorpayOrderId !== razorpayOrderId) {
        throw new ApiError(400, "Order ID does not match this sale");
    }

    const isValid = verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
    });

    if (!isValid) {
        // Deliberately do NOT trust or apply anything from this request.
        // The sale stays exactly as it was ("pending") - a later
        // reconciliation step (Phase 3, still to come) determines the
        // true status directly from Razorpay's own API rather than
        // ever trusting this unverified claim.
        throw new ApiError(
            400,
            "Payment verification failed - signature mismatch",
        );
    }

    sale.paymentStatus = "paid";
    sale.status = "completed";
    sale.razorpayPaymentId = razorpayPaymentId;
    sale.razorpaySignature = razorpaySignature;
    await sale.save({ validateBeforeSave: false });

    await Payment.findOneAndUpdate(
        { razorpayOrderId },
        {
            razorpayPaymentId,
            razorpaySignature,
            status: "captured",
            paidAt: new Date(),
        },
    );

    return await Sales.findById(saleId)
        .populate("customer", "name phone")
        .populate("items.product", "name sku");
};

export { initiateOnlinePayment, verifyPaymentService };
