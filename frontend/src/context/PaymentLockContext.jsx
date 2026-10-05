import { createContext, useContext, useState } from "react";

const PaymentLockContext = createContext(null);

export const usePaymentLock = () => useContext(PaymentLockContext);

/*
  PaymentLockProvider - while a Razorpay Checkout popup is open, the
  sale exists in the database as "pending" (that part is already safe),
  but navigating away in the SPA loses the only UI thread following that
  payment. This context is a simple app-wide flag: Billing.jsx sets it
  true right before opening Checkout and false the moment it resolves
  (success, failure, or the popup is dismissed) - Sidebar.jsx reads it
  to block navigation for that entire window.
*/
export const PaymentLockProvider = ({ children }) => {
    const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);

    return (
        <PaymentLockContext.Provider
            value={{ isPaymentInProgress, setIsPaymentInProgress }}
        >
            {children}
        </PaymentLockContext.Provider>
    );
};