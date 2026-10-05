import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    registerUser,
    loginUser,
    assignManagerRole,
    removeManagerRole,
    logoutUser,
    refreshAccessToken,
    getMyProfile,
    updateMyAvatar,
    submitVerificationDocuments,
    getPendingVerifications,
    reviewVerification,
    getAllMembers,
    getMemberById,
    deleteMember,
} from "../controllers/user.controller.js";
import { getAdminDashboard } from "../controllers/adminDashboard.controller.js";

const router = Router();

router
    .route("/register")
    .post(upload.fields([{ name: "avatar", maxCount: 1 }]), registerUser);

router.route("/login").post(loginUser);

router
    .route("/dashboard")
    .get(verifyJWT, authorizeRoles("admin"), getAdminDashboard);

router
    .route("/profile")
    .get(verifyJWT, getMyProfile)
    .patch(
        verifyJWT,
        upload.fields([{ name: "avatar", maxCount: 1 }]),
        updateMyAvatar,
    );

router
    .route("/:username/assign-manager")
    .patch(verifyJWT, authorizeRoles("admin"), assignManagerRole);

router
    .route("/:username/remove-manager")
    .patch(verifyJWT, authorizeRoles("admin"), removeManagerRole);

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/verify-documents").post(
    verifyJWT,
    authorizeRoles("employee"),
    upload.fields([
        { name: "aadharCard", maxCount: 1 },
        { name: "panCard", maxCount: 1 },
    ]),
    submitVerificationDocuments,
);

router
    .route("/verifications/pending")
    .get(verifyJWT, authorizeRoles("admin"), getPendingVerifications);

router
    .route("/verifications/:userId/review")
    .patch(verifyJWT, authorizeRoles("admin"), reviewVerification);

router.route("/members").get(verifyJWT, authorizeRoles("admin"), getAllMembers);

router
    .route("/members/:userId")
    .get(verifyJWT, authorizeRoles("admin"), getMemberById)
    .delete(verifyJWT, authorizeRoles("admin"), deleteMember);

export default router;
