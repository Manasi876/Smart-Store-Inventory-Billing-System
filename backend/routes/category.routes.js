import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

router
    .route("/")
    .get(verifyJWT, authorizeRoles("admin", "manager"), getAllCategories)
    .post(verifyJWT, authorizeRoles("admin", "manager"), createCategory);

router
    .route("/:categoryId")
    .patch(verifyJWT, authorizeRoles("admin", "manager"), updateCategory)
    .delete(verifyJWT, authorizeRoles("admin", "manager"), deleteCategory);

export default router;