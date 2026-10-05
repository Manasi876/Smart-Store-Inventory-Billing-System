import { ApiError } from "../utils/ApiError.js";
import { Category } from "../models/category.model.js";
import slugify from "slugify";


const createCategoryService = async ({ name, description, createdBy }) => {
    if (!name?.trim()) {
        throw new ApiError(400, "Category name is required");
    }

    const existedCategory = await Category.findOne({
        name: name.trim(),
    });

    if (existedCategory) {
        throw new ApiError(400, "Category with this name already exists");
    }

    const category = await Category.create({
        name: name.trim(),
        description,
        createdBy,
        slug: slugify(name, {
            lower: true,
            strict: true,
        }),
    });

    return category;
};

const getAllCategoriesService = async () => {
    const categories = await Category.find().sort({ createdAt: -1 });
    return categories;
};

const updateCategoryService = async (categoryId, { name, description }) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    if (name?.trim()) {
        const duplicate = await Category.findOne({
            name: name.trim(),
            _id: { $ne: categoryId },
        });
        if (duplicate) {
            throw new ApiError(400, "Category with this name already exists");
        }
        category.name = name.trim();
    }

    if (description !== undefined) {
        category.description = description;
    }

    await category.save();
    return category;
};

const deleteCategoryService = async (categoryId) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    await category.deleteOne();
    return category;
};

export {
    createCategoryService,
    getAllCategoriesService,
    updateCategoryService,
    deleteCategoryService,
};
