import Razorpay from "razorpay";
import crypto from "crypto";

/*
  utils/razorpayClient.js

  Same isolation pattern as utils/cloudinary.js, utils/groqClient.js, and
  utils/mailer.js - this is the ONLY file in the project that talks to
  Razorpay's SDK directly, and the only file that knows the exact
  signature-verification formula. Every other file just calls the two
  functions exported here.
*/

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/*
  createRazorpayOrder - amountInRupees is passed in normal rupees (e.g.
  499.50); Razorpay itself requires the smallest currency unit (paise
  for INR), so we multiply by 100 here rather than making every caller
  remember to do that conversion themselves.
*/
const createRazorpayOrder = async ({ amountInRupees, receipt }) => {
    const order = await razorpayInstance.orders.create({
        amount: Math.round(amountInRupees * 100),
        currency: "INR",
        receipt,
    });
    return order;
};

/*
  verifyPaymentSignature - this is the security-critical check in the
  entire integration. Razorpay signs the string "order_id|payment_id"
  using HMAC-SHA256 with your KEY_SECRET. We recompute that same
  signature ourselves and compare it byte-for-byte - if it doesn't
  match exactly, the payment claim cannot be trusted, no matter what
  the request body says happened. This is what stops someone from
  forging a fake "I paid" request directly to your API.
*/
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    return expectedSignature === signature;
};

export { razorpayInstance, createRazorpayOrder, verifyPaymentSignature };
