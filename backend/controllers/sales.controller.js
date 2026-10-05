import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    createSaleService,
    getAllSalesService,
    getSaleByIdService,
    cancelSaleService,
} from "../services/sales.services.js";

const createSale = asyncHandler(async (req, res) => {
    const { customerName, customerPhone, items, discount, tax, paymentMethod } =
        req.body;

    const { sale, onlinePayment } = await createSaleService({
        customerName,
        customerPhone,
        items,
        discount,
        tax,
        paymentMethod,
        employeeId: req.user,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { sale, onlinePayment },
                "Sale recorded successfully",
            ),
        );
});

const getAllSales = asyncHandler(async (req, res) => {
    const sales = await getAllSalesService();

    return res
        .status(200)
        .json(new ApiResponse(200, sales, "Sales fetched successfully"));
});

const getSaleById = asyncHandler(async (req, res) => {
    const { saleId } = req.params;
    const sale = await getSaleByIdService(saleId);

    return res
        .status(200)
        .json(new ApiResponse(200, sale, "Sale fetched successfully"));
});

const cancelSale = asyncHandler(async (req, res) => {
    const { saleId } = req.params;
    const sale = await cancelSaleService(saleId);

    return res
        .status(200)
        .json(new ApiResponse(200, sale, "Sale cancelled and stock restored"));
});

export { createSale, getAllSales, getSaleById, cancelSale };
