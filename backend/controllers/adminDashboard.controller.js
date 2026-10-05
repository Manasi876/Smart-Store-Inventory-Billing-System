import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getAdminDashboardService } from "../services/adminDashboard.services.js";

const getAdminDashboard = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw new ApiError(
            403,
            "Access denied. Only Admin can view this dashboard.",
        );
    }

    const dashboardData = await getAdminDashboardService();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                dashboardData,
                "Admin dashboard data fetched successfully",
            ),
        );
});

export { getAdminDashboard };
