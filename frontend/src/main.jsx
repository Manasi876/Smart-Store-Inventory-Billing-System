import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PaymentLockProvider } from "./context/PaymentLockContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <PaymentLockProvider>
                    <App />
                </PaymentLockProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
