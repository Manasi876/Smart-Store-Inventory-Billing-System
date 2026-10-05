import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { generateDescription } from "../controllers/ai.controller.js";

const router = Router();

router
    .route("/generate-description")
    .post(verifyJWT, authorizeRoles("admin", "manager"), generateDescription);

export default router;
