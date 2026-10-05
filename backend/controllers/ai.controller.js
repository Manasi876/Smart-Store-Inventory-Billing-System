import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateDescriptionService } from "../services/ai.services.js";

const generateDescription = asyncHandler(async (req, res) => {
    const { name, type } = req.body;

    const description = await generateDescriptionService({ name, type });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { description },
                "Description generated successfully",
            ),
        );
});

export { generateDescription };
