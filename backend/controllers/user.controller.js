import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {
    registerUserService,
    loginUserService,
    assignManagerRoleService,
    removeManagerRoleService,
    logoutUserService,
    refreshAccessTokenService,
    getMyProfileService,
    updateMyAvatarService,
    submitVerificationDocumentsService,
    getPendingVerificationsService,
    reviewVerificationService,
    getAllMembersService,
    getMemberByIdService,
    deleteMemberService,
} from "../services/user.services.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, mobile, role } = req.body;

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let avatarUrl = "";
    if (avatarLocalPath) {
        const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
        avatarUrl = uploadedAvatar?.secure_url || "";
    }

    const createdUser = await registerUserService({
        fullName,
        email,
        username,
        password,
        mobile,
        avatarUrl,
        role,
        isRequesterAdmin: req.user?.role === "admin",
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, "User registered successfully"),
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    const { loggedInUser, accessToken, refreshToken } = await loginUserService({
        email,
        username,
        password,
    });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully",
            ),
        );
});

const assignManagerRole = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const updatedUser = await assignManagerRoleService(username);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "User promoted to Manager successfully",
            ),
        );
});

const removeManagerRole = asyncHandler(async (req, res) => {
    const { username } = req.params;

    const updatedUser = await removeManagerRoleService(username);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Manager role removed successfully",
            ),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await logoutUserService(req.user._id);
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;
    const { accessToken, refreshToken } =
        await refreshAccessTokenService(incomingRefreshToken);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access token refreshed successfully",
            ),
        );
});

const getMyProfile = asyncHandler(async (req, res) => {
    const user = await getMyProfileService(req.user._id);
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Profile fetched successfully"));
});

const updateMyAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath)
        throw new ApiError(400, "Please select an avatar image");

    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
    if (!uploadedAvatar?.secure_url)
        throw new ApiError(500, "Failed to upload avatar");

    const updatedUser = await updateMyAvatarService(
        req.user._id,
        uploadedAvatar.secure_url,
    );
    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const submitVerificationDocuments = asyncHandler(async (req, res) => {
    const aadharLocalPath = req.files?.aadharCard?.[0]?.path;
    const panLocalPath = req.files?.panCard?.[0]?.path;

    if (!aadharLocalPath || !panLocalPath) {
        throw new ApiError(
            400,
            "Both Aadhar card and PAN card files are required",
        );
    }

    const [aadharUpload, panUpload] = await Promise.all([
        uploadOnCloudinary(aadharLocalPath),
        uploadOnCloudinary(panLocalPath),
    ]);

    if (!aadharUpload?.secure_url || !panUpload?.secure_url) {
        throw new ApiError(500, "Failed to upload documents, please try again");
    }

    const updatedUser = await submitVerificationDocumentsService(req.user._id, {
        aadharUrl: aadharUpload.secure_url,
        panUrl: panUpload.secure_url,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Documents submitted successfully. Waiting for admin verification.",
            ),
        );
});

const getPendingVerifications = asyncHandler(async (req, res) => {
    const pendingUsers = await getPendingVerificationsService();
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                pendingUsers,
                "Pending verification requests fetched successfully",
            ),
        );
});

const reviewVerification = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { decision } = req.body;
    const result = await reviewVerificationService(userId, decision);

    const messages = {
        approved: "User approved and promoted to Staff",
        rejected: "User rejected and removed from the system",
        kept: "User kept as Employee",
    };

    return res
        .status(200)
        .json(new ApiResponse(200, result.user, messages[result.action]));
});

const getAllMembers = asyncHandler(async (req, res) => {
    const members = await getAllMembersService();
    return res
        .status(200)
        .json(new ApiResponse(200, members, "Members fetched successfully"));
});

const getMemberById = asyncHandler(async (req, res) => {
    const member = await getMemberByIdService(req.params.userId);
    return res
        .status(200)
        .json(
            new ApiResponse(200, member, "Member details fetched successfully"),
        );
});

const deleteMember = asyncHandler(async (req, res) => {
    const result = await deleteMemberService(req.params.userId, req.user._id);
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Member permanently deleted"));
});

export {
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
};