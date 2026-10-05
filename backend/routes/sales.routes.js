import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
    createSale,
    getAllSales,
    getSaleById,
    cancelSale,
} from "../controllers/sales.controller.js";

const router = Router();

router
    .route("/")
    .get(verifyJWT, authorizeRoles("admin", "manager"), getAllSales)
    .post(
        verifyJWT,
        authorizeRoles("admin", "manager", "cashier", "staff"),
        createSale,
    );

router
    .route("/:saleId")
    .get(verifyJWT, authorizeRoles("admin", "manager"), getSaleById);

// Same roles who can create a sale can also cancel their own stuck
// pending one - no need to escalate to a manager just to resolve it.
router
    .route("/:saleId/cancel")
    .patch(
        verifyJWT,
        authorizeRoles("admin", "manager", "cashier", "staff"),
        cancelSale,
    );

export default router;
