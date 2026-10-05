import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Authorization header is checked FIRST. This app relies on
        // localStorage + Bearer tokens as the primary auth mechanism
        // (works reliably cross-site). Cookies are cross-domain here
        // (Netlify frontend, Render backend) and can be blocked or left
        // stale by browser third-party-cookie policies, which was
        // causing an old session's cookie to override a fresh login.
        const token =
            req.header("Authorization")?.replace("Bearer ", "") ||
            req.cookies?.accessToken;

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken",
        );

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export const authorizeRoles = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
            );
        }
        next();
    };
};

export const verifyJWTOptional = asyncHandler(async (req, _res, next) => {
    try {
        const token =
            req.header("Authorization")?.replace("Bearer ", "") ||
            req.cookies?.accessToken;

        if (!token) {
            req.user = null;
            return next();
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken",
        );

        req.user = user || null;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
});