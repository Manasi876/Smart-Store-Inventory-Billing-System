import { ApiError } from "../utils/ApiError.js";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

const createProductService = async ({
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
    createdBy,
}) => {
    if (
        [name, sku, category, purchasePrice, sellingPrice].some(
            (field) => field === undefined || field === "",
        )
    ) {
        throw new ApiError(
            400,
            "name, sku, category, purchasePrice and sellingPrice are required",
        );
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        throw new ApiError(400, "Invalid category - category does not exist");
    }

    const existedProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existedProduct) {
        throw new ApiError(400, "Product with this SKU already exists");
    }

    if (Number(sellingPrice) < Number(purchasePrice)) {
        throw new ApiError(
            400,
            "Selling price cannot be less than purchase price",
        );
    }

    const product = await Product.create({
        name,
        description,
        sku: sku.toUpperCase(),
        category,
        supplier,
        unit,
        purchasePrice,
        sellingPrice,
        quantityInStock: quantityInStock || 0,
        reorderLevel,
        createdBy,
    });

    return product;
};

const getAllProductsService = async () => {
    const products = await Product.find()
        .populate("category", "name")
        .sort({ createdAt: -1 });
    return products;
};

const getProductByIdService = async (productId) => {
    const product = await Product.findById(productId).populate(
        "category",
        "name",
    );

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return product;
};

const updateProductService = async (productId, updates) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (updates.category) {
        const categoryExists = await Category.findById(updates.category);
        if (!categoryExists) {
            throw new ApiError(
                400,
                "Invalid category - category does not exist",
            );
        }
    }

    if (updates.sku && updates.sku.toUpperCase() !== product.sku) {
        const duplicate = await Product.findOne({
            sku: updates.sku.toUpperCase(),
            _id: { $ne: productId },
        });
        if (duplicate) {
            throw new ApiError(400, "Product with this SKU already exists");
        }
        updates.sku = updates.sku.toUpperCase();
    }

    const finalPurchasePrice = updates.purchasePrice ?? product.purchasePrice;
    const finalSellingPrice = updates.sellingPrice ?? product.sellingPrice;
    if (Number(finalSellingPrice) < Number(finalPurchasePrice)) {
        throw new ApiError(
            400,
            "Selling price cannot be less than purchase price",
        );
    }

    Object.assign(product, updates);
    await product.save();

    return product;
};

const deleteProductService = async (productId) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    await product.deleteOne();
    return product;
};

const restockProductService = async (productId, quantity) => {
    if (!quantity || Number(quantity) <= 0) {
        throw new ApiError(400, "Restock quantity must be a positive number");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    product.quantityInStock += Number(quantity);

    // Restocking means someone has acted on the shortage - reset both
    // flags so a future dip below the threshold triggers a fresh alert
    // instead of staying silent forever after the first email.
    product.lowStockAlertSent = false;
    product.outOfStockAlertSent = false;

    await product.save({ validateBeforeSave: false });

    return product;
};

export {
    createProductService,
    getAllProductsService,
    getProductByIdService,
    updateProductService,
    deleteProductService,
    restockProductService,
};