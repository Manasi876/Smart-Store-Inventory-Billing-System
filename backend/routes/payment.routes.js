import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
    verifyPayment,
    getPaymentConfig,
} from "../controllers/payment.controller.js";

const router = Router();

router
    .route("/verify")
    .post(
        verifyJWT,
        authorizeRoles("admin", "manager", "cashier", "staff"),
        verifyPayment,
    );

router
    .route("/config")
    .get(
        verifyJWT,
        authorizeRoles("admin", "manager", "cashier", "staff"),
        getPaymentConfig,
    );

export default router;
