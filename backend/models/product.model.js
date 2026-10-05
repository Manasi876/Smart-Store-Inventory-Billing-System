import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true, // stock keeping unit - har product ka unique identifier
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        supplier: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
        },
        unit: {
            type: String,
            enum: ["pcs", "kg", "gram", "litre", "ml", "box", "packet"],
            default: "pcs",
        },
        purchasePrice: {
            type: Number,
            required: true,
            min: 0, // jitne mein hum kharida
        },
        sellingPrice: {
            type: Number,
            required: true,
            min: 0, // jitne mein hum bechenge
        },
        quantityInStock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        reorderLevel: {
            type: Number,
            default: 10, // isse neeche stock gaya toh restock ka alert bajega
        },
        // These two flags stop the same low-stock/out-of-stock email from
        // being sent again on every subsequent sale of the same product.
        // They get reset to false whenever the product is restocked.
        lowStockAlertSent: {
            type: Boolean,
            default: false,
        },
        outOfStockAlertSent: {
            type: Boolean,
            default: false,
        },
        images: [
            {
                type: String, // cloudinary/local urls
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true },
);

export const Product = mongoose.model("Product", productSchema);