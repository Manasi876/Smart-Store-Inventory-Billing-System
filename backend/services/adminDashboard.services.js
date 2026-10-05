import { Sales } from "../models/sales.model.js";

const getAdminDashboardService = async () => {
    const totalSalesCount = await Sales.countDocuments({ status: "completed" });

    const revenueResult = await Sales.aggregate([
        { $match: { status: "completed", paymentStatus: "paid" } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$grandTotal" },
            },
        },
    ]);

    const paymentResult = await Sales.aggregate([
        { $match: { status: "completed", paymentStatus: "paid" } },
        {
            $group: {
                _id: "$paymentMethod",
                amount: { $sum: "$grandTotal" },
                count: { $sum: 1 },
            },
        },
        { $sort: { amount: -1 } },
    ]);

    const paymentMethodTotals = {
        cash: 0,
        card: 0,
        upi: 0,
        netbanking: 0,
        wallet: 0,
    };

    const paymentMethodCounts = {
        cash: 0,
        card: 0,
        upi: 0,
        netbanking: 0,
        wallet: 0,
    };

    paymentResult.forEach(({ _id, amount, count }) => {
        if (_id in paymentMethodTotals) {
            paymentMethodTotals[_id] = amount;
            paymentMethodCounts[_id] = count;
        }
    });

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const recentSales = await Sales.find({ status: "completed" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("customer", "name phone")
        .populate("items.product", "name sku");

    return {
        totalSalesCount,
        totalRevenue,
        paymentMethodTotals,
        paymentMethodCounts,
        recentSales,
    };
};

export { getAdminDashboardService };
