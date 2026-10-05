import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Sales } from "../models/sales.model.js";
import { Product } from "../models/product.model.js";
import { Customer } from "../models/customer.model.js";
import { Payment } from "../models/payment.model.js";
import { checkAndSendStockAlerts } from "./stockAlert.services.js";
import { initiateOnlinePayment } from "./payment.services.js";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const paymentMethods = ["cash", "card", "upi", "netbanking", "wallet"];
const ONLINE_METHODS = ["card", "upi", "netbanking", "wallet"];

const createSaleService = async ({
    customerName,
    customerPhone,
    items,
    discount = 0,
    tax = 0,
    paymentMethod,
    employeeId,
}) => {
    if (!customerName?.trim() || !customerPhone?.trim()) {
        throw new ApiError(400, "Customer name and mobile number are required");
    }

    if (!MOBILE_REGEX.test(customerPhone.trim())) {
        throw new ApiError(
            400,
            "Please provide a valid 10-digit customer mobile number",
        );
    }

    if (!items || items.length === 0) {
        throw new ApiError(
            400,
            "At least one item is required to create a sale",
        );
    }

    if (!paymentMethods.includes(paymentMethod)) {
        throw new ApiError(400, "Invalid payment method");
    }

    const isOnlinePayment = ONLINE_METHODS.includes(paymentMethod);
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        let subTotal = 0;
        const saleItems = [];

        for (const item of items) {
            const product = await Product.findOneAndUpdate(
                { _id: item.product, quantityInStock: { $gte: item.quantity } },
                { $inc: { quantityInStock: -item.quantity } },
                { new: true, session },
            );

            if (!product) {
                const existing = await Product.findById(item.product).session(
                    session,
                );
                if (!existing) {
                    throw new ApiError(
                        404,
                        `Product not found: ${item.product}`,
                    );
                }
                throw new ApiError(
                    400,
                    `Insufficient stock for "${existing.name}". Available: ${existing.quantityInStock}`,
                );
            }

            const itemSubtotal = product.sellingPrice * item.quantity;
            subTotal += itemSubtotal;

            saleItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.sellingPrice,
                subtotal: itemSubtotal,
            });
        }

        const safeDiscount = Number(discount || 0);
        const safeTax = Number(tax || 0);
        const grandTotal = subTotal - safeDiscount + safeTax;

        if (grandTotal < 0) {
            throw new ApiError(400, "Grand total cannot be negative");
        }

        const customer = await Customer.findOneAndUpdate(
            { phone: customerPhone.trim() },
            {
                $set: {
                    name: customerName.trim(),
                    phone: customerPhone.trim(),
                    isActive: true,
                },
                $inc: { totalPurchases: grandTotal },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true, session },
        );

        const invoiceNumber = `INV-${Date.now()}`;

        const [sale] = await Sales.create(
            [
                {
                    invoiceNumber,
                    customer: customer._id,
                    soldBy: {
                        userId: employeeId._id,
                        fullName: employeeId.fullName,
                        username: employeeId.username,
                        role: employeeId.role,
                    },
                    items: saleItems,
                    subTotal,
                    discount: safeDiscount,
                    tax: safeTax,
                    grandTotal,
                    paymentMethod,
                    paymentStatus: isOnlinePayment ? "pending" : "paid",
                    status: isOnlinePayment ? "pending" : "completed",
                },
            ],
            { session },
        );

        await session.commitTransaction();
        session.endSession();

        checkAndSendStockAlerts(saleItems).catch((err) =>
            console.error("Stock alert check failed:", err.message),
        );

        let onlinePayment = null;
        if (isOnlinePayment) {
            onlinePayment = await initiateOnlinePayment(sale);
        }

        const populatedSale = await Sales.findById(sale._id)
            .populate("customer", "name phone")
            .populate("items.product", "name sku");

        return { sale: populatedSale, onlinePayment };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const getAllSalesService = async () => {
    return await Sales.find()
        .sort({ createdAt: -1 })
        .populate("customer", "name phone")
        .populate("items.product", "name sku");
};

const getSaleByIdService = async (saleId) => {
    const sale = await Sales.findById(saleId)
        .populate("customer", "name phone")
        .populate("items.product", "name sku");

    if (!sale) {
        throw new ApiError(404, "Sale not found");
    }

    return sale;
};

/*
  cancelSaleService - resolves a sale that's been stuck in "pending"
  because the customer's online payment was abandoned or failed. Only
  "pending" sales can be cancelled through this path - a "completed"
  cash sale needs a proper returns flow, not this.

  Stock that was decremented at sale-creation time (Option A from our
  architecture discussion - we decrement immediately for both cash and
  online) is rolled back here, wrapped in its own transaction so the
  rollback and status change happen atomically together.
*/
const cancelSaleService = async (saleId) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const sale = await Sales.findById(saleId).session(session);

        if (!sale) {
            throw new ApiError(404, "Sale not found");
        }

        if (sale.status !== "pending") {
            throw new ApiError(
                400,
                `Only pending sales can be cancelled. This sale is currently "${sale.status}".`,
            );
        }

        for (const item of sale.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { quantityInStock: item.quantity } },
                { session },
            );
        }

        sale.status = "cancelled";
        sale.paymentStatus = "failed";
        await sale.save({ session });

        if (sale.razorpayOrderId) {
            await Payment.findOneAndUpdate(
                { razorpayOrderId: sale.razorpayOrderId },
                { status: "failed" },
                { session },
            );
        }

        await session.commitTransaction();
        session.endSession();

        return await Sales.findById(saleId)
            .populate("customer", "name phone")
            .populate("items.product", "name sku");
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export {
    createSaleService,
    getAllSalesService,
    getSaleByIdService,
    cancelSaleService,
};
