import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    restockProduct,
} from "../controllers/product.controller.js";

const router = Router();

// Products dekhna sabke liye zaroori hai (Billing screen ke liye bhi)
router
    .route("/")
    .get(
        verifyJWT,
        authorizeRoles("admin", "manager", "cashier", "staff"),
        getAllProducts,
    )
    .post(verifyJWT, authorizeRoles("admin", "manager"), createProduct);

router
    .route("/:productId")
    .get(
        verifyJWT,
        authorizeRoles("admin", "manager", "cashier", "staff"),
        getProductById,
    )
    .patch(verifyJWT, authorizeRoles("admin", "manager"), updateProduct)
    .delete(verifyJWT, authorizeRoles("admin", "manager"), deleteProduct);

router
    .route("/:productId/restock")
    .patch(verifyJWT, authorizeRoles("admin", "manager"), restockProduct);

export default router;