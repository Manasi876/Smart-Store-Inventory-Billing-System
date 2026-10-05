import { useEffect, useState } from "react";
import {
    Eye,
    UserRound,
    Phone,
    CreditCard,
    ReceiptText,
    XCircle,
    RefreshCw,
} from "lucide-react";
import {
    getSales,
    cancelSale,
    verifyPayment,
    getPaymentConfig,
} from "../../api/sales.api.js";
import { loadRazorpayScript } from "../../utils/loadRazorpayScript.js";
import { usePaymentLock } from "../../context/PaymentLockContext.jsx";
import Modal from "../../components/Modal.jsx";

const STATUS_STYLES = {
    completed: "bg-green-50 text-green-600",
    pending: "bg-amber-50 text-amber-600",
    cancelled: "bg-red-50 text-red-600",
    returned: "bg-amber-50 text-amber-600",
};

const InvoiceHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSale, setSelectedSale] = useState(null);
    const [actingOn, setActingOn] = useState(null); // saleId currently being cancelled/retried
    const { setIsPaymentInProgress } = usePaymentLock();

    const fetchSales = async () => {
        try {
            const { data } = await getSales();
            setSales(data.data);
        } catch (err) {
            setError(
                err.response?.data?.message || "Invoices could not be loaded",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleCancel = async (sale) => {
        if (
            !window.confirm(
                `Cancel invoice ${sale.invoiceNumber}? This will restore its stock and cannot be undone.`,
            )
        ) {
            return;
        }
        setActingOn(sale._id);
        try {
            await cancelSale(sale._id);
            await fetchSales();
        } catch (err) {
            alert(err.response?.data?.message || "Could not cancel this sale");
        } finally {
            setActingOn(null);
        }
    };

    const handleRetryPayment = async (sale) => {
        setActingOn(sale._id);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                alert(
                    "Could not load the payment gateway. Please check your connection.",
                );
                setActingOn(null);
                return;
            }

            const { data: configRes } = await getPaymentConfig();

            setIsPaymentInProgress(true);

            const options = {
                key: configRes.data.razorpayKeyId,
                amount: Math.round(sale.grandTotal * 100),
                currency: "INR",
                order_id: sale.razorpayOrderId,
                name: "StoreDesk POS",
                description: `Invoice ${sale.invoiceNumber}`,
                prefill: {
                    name: sale.customer?.name,
                    contact: sale.customer?.phone,
                },
                handler: async (response) => {
                    try {
                        await verifyPayment({
                            saleId: sale._id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        await fetchSales();
                    } catch (err) {
                        alert(
                            err.response?.data?.message ||
                                "Payment succeeded but verification failed - please contact support.",
                        );
                    } finally {
                        setActingOn(null);
                        setIsPaymentInProgress(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setActingOn(null);
                        setIsPaymentInProgress(false);
                    },
                },
                theme: { color: "#2338ce" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert(
                err.response?.data?.message || "Could not start payment retry",
            );
            setActingOn(null);
            setIsPaymentInProgress(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                    Invoice History
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    View previous bills, customers, payment methods, and sellers
                </p>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                    <thead>
                        <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="px-5 py-3 font-semibold">Invoice</th>
                            <th className="px-5 py-3 font-semibold">
                                Customer
                            </th>
                            <th className="px-5 py-3 font-semibold">Sold By</th>
                            <th className="px-5 py-3 font-semibold">Payment</th>
                            <th className="px-5 py-3 font-semibold">Date</th>
                            <th className="px-5 py-3 font-semibold">Total</th>
                            <th className="px-5 py-3 font-semibold">Status</th>
                            <th className="px-5 py-3 font-semibold text-right">
                                View
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-6 py-8 text-center text-slate-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-6 py-8 text-center text-slate-400"
                                >
                                    No invoices found
                                </td>
                            </tr>
                        ) : (
                            sales.map((sale) => (
                                <tr
                                    key={sale._id}
                                    className="border-t border-slate-100 hover:bg-slate-50/60"
                                >
                                    <td className="px-5 py-3.5 font-medium text-slate-900">
                                        {sale.invoiceNumber}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-slate-800">
                                            {sale.customer?.name || "—"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {sale.customer?.phone || "—"}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-slate-800">
                                            {sale.soldBy?.fullName || "—"}
                                        </p>
                                        <p className="text-xs text-slate-400 capitalize">
                                            {sale.soldBy?.role || "—"}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold capitalize">
                                            {sale.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500">
                                        {new Date(
                                            sale.saleDate,
                                        ).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                                        ₹{sale.grandTotal}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[sale.status] || "bg-slate-100 text-slate-600"}`}
                                        >
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {sale.status === "pending" && (
                                                <>
                                                    <button
                                                        disabled={
                                                            actingOn ===
                                                            sale._id
                                                        }
                                                        onClick={() =>
                                                            handleRetryPayment(
                                                                sale,
                                                            )
                                                        }
                                                        title="Retry Payment"
                                                        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                                                    >
                                                        <RefreshCw size={13} />
                                                        Retry
                                                    </button>
                                                    <button
                                                        disabled={
                                                            actingOn ===
                                                            sale._id
                                                        }
                                                        onClick={() =>
                                                            handleCancel(sale)
                                                        }
                                                        title="Cancel Sale"
                                                        className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                                                    >
                                                        <XCircle size={13} />
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() =>
                                                    setSelectedSale(sale)
                                                }
                                                className="text-slate-400 hover:text-brand-600"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedSale && (
                <Modal
                    title={`Invoice ${selectedSale.invoiceNumber}`}
                    onClose={() => setSelectedSale(null)}
                >
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <UserRound size={14} />
                                    Customer
                                </div>
                                <p className="font-semibold text-slate-900 mt-1">
                                    {selectedSale.customer?.name}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <Phone size={14} />
                                    Contact
                                </div>
                                <p className="font-semibold text-slate-900 mt-1">
                                    {selectedSale.customer?.phone}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <CreditCard size={14} />
                                    Payment
                                </div>
                                <p className="font-semibold text-slate-900 mt-1 capitalize">
                                    {selectedSale.paymentMethod}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <ReceiptText size={14} />
                                    Sold By
                                </div>
                                <p className="font-semibold text-slate-900 mt-1">
                                    {selectedSale.soldBy?.fullName}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {selectedSale.items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex justify-between text-sm border-b border-slate-100 pb-2"
                                >
                                    <span className="text-slate-600">
                                        {item.product?.name || "Product"} ×{" "}
                                        {item.quantity}
                                    </span>
                                    <span className="font-medium text-slate-900">
                                        ₹{item.subtotal}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 space-y-1.5">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Subtotal</span>
                                <span>₹{selectedSale.subTotal}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Discount</span>
                                <span>-₹{selectedSale.discount}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Tax</span>
                                <span>+₹{selectedSale.tax}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                                <span>Grand Total</span>
                                <span>₹{selectedSale.grandTotal}</span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default InvoiceHistory;
