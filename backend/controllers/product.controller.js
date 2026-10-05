import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    createProductService,
    getAllProductsService,
    getProductByIdService,
    updateProductService,
    deleteProductService,
    restockProductService,
} from "../services/product.services.js";

const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        sku,
        category,
        supplier,
        unit,
        purchasePrice,
        sellingPrice,
        quantityInStock,
        reorderLevel,
    } = req.body;

    const product = await createProductService({
        name,
        description,
        sku,
        category,
        supplier,
        unit,
        purchasePrice,
        sellingPrice,
        quantityInStock,
        reorderLevel,
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
    const products = await getAllProductsService();

    return res
        .status(200)
        .json(new ApiResponse(200, products, "Products fetched successfully"));
});

const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const product = await getProductByIdService(productId);

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const product = await updateProductService(productId, req.body);

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product updated successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    await deleteProductService(productId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

const restockProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    const product = await restockProductService(productId, quantity);

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product restocked successfully"));
});

export {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    restockProduct,
};
