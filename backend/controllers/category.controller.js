import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    createCategoryService,
    getAllCategoriesService,
    updateCategoryService,
    deleteCategoryService,
} from "../services/category.services.js";

const createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const category = await createCategoryService({
        name,
        description,
        createdBy: req.user._id, // req.user verifyJWT se aata hai
    });

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"));
});

const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await getAllCategoriesService();

    return res
        .status(200)
        .json(
            new ApiResponse(200, categories, "Categories fetched successfully"),
        );
});

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    const category = await updateCategoryService(categoryId, {
        name,
        description,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category updated successfully"));
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    await deleteCategoryService(categoryId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Category deleted successfully"));
});

export { createCategory, getAllCategories, updateCategory, deleteCategory };
