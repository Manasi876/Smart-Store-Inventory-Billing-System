/*
  Loads Razorpay's Checkout script only once, and only when actually
  needed (i.e. the first time someone pays online) - not on every page
  load, since most sales might still be cash.
*/
let razorpayScriptPromise = null;

export const loadRazorpayScript = () => {
    if (window.Razorpay) return Promise.resolve(true);

    if (!razorpayScriptPromise) {
        razorpayScriptPromise = new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    return razorpayScriptPromise;
};
