import mongoose, { Schema } from "mongoose";

const supplierSchema = new Schema(
    {
        companyName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        contactPerson: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },
        productsSupplied: [
            {
                type: Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        lastSupplyDate: {
            type: Date, // aakhri baar kab stock supply hua tha
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

export const Supplier = mongoose.model("Supplier", supplierSchema);
