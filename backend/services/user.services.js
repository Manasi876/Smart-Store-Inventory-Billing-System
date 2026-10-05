import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const ALLOWED_ROLES = ["admin", "manager", "cashier", "staff", "employee"];
const MOBILE_REGEX = /^[6-9]\d{9}$/;

const safeUserQuery = (query) => query.select("-password -refreshToken");

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens",
        );
    }
};

const registerUserService = async ({
    fullName,
    email,
    username,
    password,
    mobile,
    avatarUrl,
    role,
    isRequesterAdmin,
}) => {
    if (
        [fullName, email, username, password, mobile].some(
            (field) => field?.toString().trim() === "" || field === undefined,
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    if (!MOBILE_REGEX.test(mobile)) {
        throw new ApiError(
            400,
            "Please provide a valid 10-digit mobile number",
        );
    }

    if (role && !ALLOWED_ROLES.includes(role)) {
        throw new ApiError(
            400,
            `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(", ")}`,
        );
    }

    let finalRole = "employee";
    if (role) {
        if (isRequesterAdmin) {
            finalRole = role;
        } else {
            throw new ApiError(
                403,
                "Only an Admin can assign a custom role. New users are registered as employees by default.",
            );
        }
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }, { mobile }],
    });

    if (existedUser) {
        throw new ApiError(
            400,
            "User already exists with the provided email, username or mobile number",
        );
    }

    const user = await User.create({
        fullName,
        email,
        password,
        mobile,
        avatar: avatarUrl || "",
        username: username.toLowerCase(),
        role: finalRole,
    });

    const createdUser = await safeUserQuery(User.findById(user._id));

    if (!createdUser) {
        throw new ApiError(500, "User registration failed");
    }

    return createdUser;
};

const loginUserService = async ({ email, username, password }) => {
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(
            404,
            "User doesn't exist with the provided email or username",
        );
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
    );

    const loggedInUser = await safeUserQuery(User.findById(user._id));

    return { loggedInUser, accessToken, refreshToken };
};

const assignManagerRoleService = async (username) => {
    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.role === "admin") {
        throw new ApiError(400, "Cannot change role of another Admin");
    }

    if (user.role === "manager") {
        throw new ApiError(400, "User is already a Manager");
    }

    user.role = "manager";
    await user.save({ validateBeforeSave: false });

    return await safeUserQuery(User.findOne({ username }));
};

const removeManagerRoleService = async (username) => {
    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.role === "admin") {
        throw new ApiError(400, "Cannot change role of an Admin");
    }

    if (user.role !== "manager") {
        throw new ApiError(400, "User is not a Manager");
    }

    user.role = "staff";

    await user.save({
        validateBeforeSave: false,
    });

    return await safeUserQuery(User.findOne({ username }));
};

const logoutUserService = async (userId) => {
    await User.findByIdAndUpdate(
        userId,
        { $set: { refreshToken: null } },
        { new: true },
    );
};

const refreshAccessTokenService = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or already used");
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
};

const getMyProfileService = async (userId) => {
    const user = await safeUserQuery(User.findById(userId));
    if (!user) throw new ApiError(404, "User not found");
    return user;
};

const updateMyAvatarService = async (userId, avatarUrl) => {
    if (!avatarUrl) throw new ApiError(400, "Avatar image is required");

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: avatarUrl } },
        { new: true, runValidators: true },
    );

    if (!user) throw new ApiError(404, "User not found");
    return await safeUserQuery(User.findById(user._id));
};

const submitVerificationDocumentsService = async (
    userId,
    { aadharUrl, panUrl },
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.role !== "employee") {
        throw new ApiError(
            400,
            "Only employees can submit verification documents",
        );
    }

    if (user.verificationStatus === "pending") {
        throw new ApiError(400, "Your verification request is already pending");
    }

    if (!aadharUrl || !panUrl) {
        throw new ApiError(400, "Both Aadhar card and PAN card are required");
    }

    user.aadharCard = aadharUrl;
    user.panCard = panUrl;
    user.verificationStatus = "pending";
    await user.save({ validateBeforeSave: false });

    return await safeUserQuery(User.findById(userId));
};

const getPendingVerificationsService = async () => {
    return await safeUserQuery(
        User.find({ role: "employee", verificationStatus: "pending" }).sort({
            updatedAt: -1,
        }),
    );
};

const reviewVerificationService = async (userId, decision) => {
    const user = await User.findById(userId);

    if (!user) throw new ApiError(404, "User not found");
    if (user.role !== "employee") {
        throw new ApiError(400, "This user is not pending verification");
    }

    if (decision === "approve") {
        user.role = "staff";
        user.verificationStatus = "approved";
        await user.save({ validateBeforeSave: false });
        return {
            action: "approved",
            user: await safeUserQuery(User.findById(userId)),
        };
    }

    if (decision === "reject") {
        await user.deleteOne();
        return { action: "rejected", user: null };
    }

    if (decision === "keep") {
        user.verificationStatus = "not_submitted";
        user.aadharCard = undefined;
        user.panCard = undefined;
        await user.save({ validateBeforeSave: false });
        return {
            action: "kept",
            user: await safeUserQuery(User.findById(userId)),
        };
    }

    throw new ApiError(
        400,
        "Invalid decision. Must be 'approve', 'reject', or 'keep'",
    );
};

const getAllMembersService = async () => {
    return await safeUserQuery(
        User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }),
    );
};

const getMemberByIdService = async (userId) => {
    const user = await safeUserQuery(User.findById(userId));
    if (!user) throw new ApiError(404, "Member not found");
    return user;
};

const deleteMemberService = async (userId, adminId) => {
    if (userId === String(adminId)) {
        throw new ApiError(400, "You cannot delete your own admin account");
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "Member not found");
    if (user.role === "admin") {
        throw new ApiError(
            403,
            "Admin accounts cannot be deleted from All Members",
        );
    }

    await user.deleteOne();
    return { deletedUserId: userId };
};

export {
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
};
