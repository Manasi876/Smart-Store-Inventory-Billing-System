import { useEffect, useMemo, useRef, useState } from "react";
import {
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    CheckCircle2,
    Search,
} from "lucide-react";
import { getProducts } from "../../api/product.api.js";
import { createSale, verifyPayment } from "../../api/sales.api.js";
import { loadRazorpayScript } from "../../utils/loadRazorpayScript.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { usePaymentLock } from "../../context/PaymentLockContext.jsx";

const PAYMENT_METHODS = ["cash", "card", "upi", "netbanking", "wallet"];
const ONLINE_METHODS = ["card", "upi", "netbanking", "wallet"];

const Billing = () => {
    const { user } = useAuth();
    const { isPaymentInProgress, setIsPaymentInProgress } = usePaymentLock();
    const [products, setProducts] = useState([]);

    // Warns on an actual browser tab close/refresh too, not just in-app
    // navigation (which Sidebar already blocks separately).
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isPaymentInProgress) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isPaymentInProgress]);
    const [cart, setCart] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [showResults, setShowResults] = useState(false);
    const searchBoxRef = useRef(null);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [invoice, setInvoice] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await getProducts();
                setProducts(data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        "Products could not be loaded",
                );
            }
        };
        fetchProducts();
    }, []);

    // Close the search results dropdown when clicking anywhere outside it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                searchBoxRef.current &&
                !searchBoxRef.current.contains(e.target)
            ) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchResults = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return [];
        return products
            .filter(
                (product) =>
                    product.name?.toLowerCase().includes(term) ||
                    product.sku?.toLowerCase().includes(term),
            )
            .slice(0, 8);
    }, [productSearch, products]);

    /*
      addProductToCart - clicking a search result adds it straight to
      the cart (quantity 1), or bumps the existing quantity by 1 if it's
      already in the cart. From there, the +/- steppers on each cart row
      let the cashier adjust quantity without re-searching.
    */
    const addProductToCart = (productId) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.productId === productId);
            if (existing) {
                return prev.map((item) =>
                    item.productId === productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }
            return [...prev, { productId, quantity: 1 }];
        });
        setProductSearch("");
        setShowResults(false);
    };

    const incrementQty = (productId) => {
        setCart((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
            ),
        );
    };

    const decrementQty = (productId) => {
        setCart((prev) =>
            prev
                .map((item) =>
                    item.productId === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    };

    const removeFromCart = (productId) => {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
    };

    const getProduct = (productId) => products.find((p) => p._id === productId);

    const subTotal = cart.reduce((sum, item) => {
        const product = getProduct(item.productId);
        return sum + (product ? product.sellingPrice * item.quantity : 0);
    }, 0);

    const grandTotal = subTotal - Number(discount || 0) + Number(tax || 0);

    /*
      openRazorpayCheckout - only called when the sale's response came
      back with a non-null "onlinePayment" object (i.e. paymentMethod
      was card/upi/netbanking/wallet). Razorpay's own popup shows all
      of those payment methods as tabs inside ONE widget - we don't
      build separate UI per method ourselves.
    */
    const openRazorpayCheckout = async (sale, onlinePayment) => {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setError(
                "Could not load the payment gateway. Please check your connection and try again.",
            );
            setSaving(false);
            return;
        }

        // Lock navigation from this point until the popup resolves one
        // way or another (paid, failed verification, or dismissed).
        setIsPaymentInProgress(true);

        const options = {
            key: onlinePayment.razorpayKeyId,
            amount: onlinePayment.amount,
            currency: onlinePayment.currency,
            order_id: onlinePayment.razorpayOrderId,
            name: "StoreDesk POS",
            description: `Invoice ${sale.invoiceNumber}`,
            prefill: {
                name: customerName,
                contact: customerPhone,
            },
            handler: async (response) => {
                // This callback only fires after Razorpay itself has
                // already accepted the payment - but we still verify the
                // signature on our own backend before trusting it at all.
                try {
                    const { data } = await verifyPayment({
                        saleId: sale._id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    });

                    setInvoice(data.data);

                    // 🔥 Fetch latest stock after sale
                    const { data: productData } = await getProducts();
                    setProducts(productData.data);

                    // Clear form
                    setCart([]);
                    setCustomerName("");
                    setCustomerPhone("");
                    setDiscount(0);
                    setTax(0);
                } catch (err) {
                    setError(
                        err.response?.data?.message ||
                            `Payment succeeded but verification failed. Please contact support with this invoice number: ${sale.invoiceNumber}`,
                    );
                } finally {
                    setSaving(false);
                    setIsPaymentInProgress(false);
                }
            },
            modal: {
                ondismiss: () => {
                    // Customer closed the popup without paying. The sale
                    // already exists in the database as "pending" - it is
                    // NOT lost, and can be reconciled later.
                    setError(
                        `Payment was not completed for invoice ${sale.invoiceNumber}. The sale is saved as pending - you can follow up with the customer, cancel it, or retry payment from Invoice History.`,
                    );
                    setSaving(false);
                    setIsPaymentInProgress(false);
                },
            },
            theme: {
                color: "#2338ce",
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handleCompleteSale = async () => {
        if (!customerName.trim() || !customerPhone.trim()) {
            setError("Customer name and mobile number are required");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(customerPhone.trim())) {
            setError("Please enter a valid 10-digit customer mobile number");
            return;
        }

        if (cart.length === 0) {
            setError("Add at least one product to the cart");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const { data } = await createSale({
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                items: cart.map((item) => ({
                    product: item.productId,
                    quantity: item.quantity,
                })),
                discount: Number(discount || 0),
                tax: Number(tax || 0),
                paymentMethod,
            });

            const { sale, onlinePayment } = data.data;

            if (ONLINE_METHODS.includes(paymentMethod) && onlinePayment) {
                // Don't clear the form or show the invoice yet - the sale
                // is still "pending" until Razorpay Checkout completes.
                // "saving" stays true until the handler/dismiss callback
                // above resolves it.
                await openRazorpayCheckout(sale, onlinePayment);
                return;
            }

            // Cash - sale is already "completed", same as before.
            setInvoice(sale);

            // 🔥 Fetch latest stock after sale
            const { data: productData } = await getProducts();
            setProducts(productData.data);

            // Clear form
            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            setDiscount(0);
            setTax(0);
            setSaving(false);
        } catch (err) {
            setError(
                err.response?.data?.message || "Sale could not be created",
            );
            setSaving(false);
        }
    };

    if (invoice) {
        return (
            <div className="max-w-xl mx-auto">
                <div className="bg-white border border-slate-200 rounded-2xl p-8">
                    <div className="text-center">
                        <CheckCircle2
                            size={48}
                            className="mx-auto text-green-600"
                        />
                        <h2 className="text-xl font-bold text-slate-900 mt-4">
                            Sale Completed
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Invoice {invoice.invoiceNumber}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-7 p-4 rounded-xl bg-slate-50">
                        <div>
                            <p className="text-xs text-slate-400">Customer</p>
                            <p className="font-semibold text-slate-900 mt-1">
                                {invoice.customer?.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Contact</p>
                            <p className="font-semibold text-slate-900 mt-1">
                                {invoice.customer?.phone}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Payment</p>
                            <p className="font-semibold text-slate-900 mt-1 capitalize">
                                {invoice.paymentMethod}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Sold by</p>
                            <p className="font-semibold text-slate-900 mt-1">
                                {invoice.soldBy?.fullName || user?.fullName}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 mt-5 pt-5 flex justify-between text-lg font-bold text-slate-900">
                        <span>Total Paid</span>
                        <span>₹{invoice.grandTotal}</span>
                    </div>

                    <button
                        onClick={() => setInvoice(null)}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors mt-6"
                    >
                        New Sale
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Billing</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Create a new customer bill
                </p>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">
                            Customer Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Customer Name *
                                </label>
                                <input
                                    value={customerName}
                                    onChange={(e) =>
                                        setCustomerName(e.target.value)
                                    }
                                    placeholder="Full name"
                                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Mobile Number *
                                </label>
                                <input
                                    value={customerPhone}
                                    onChange={(e) =>
                                        setCustomerPhone(
                                            e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 10),
                                        )
                                    }
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-white border border-slate-200 rounded-2xl p-5 relative"
                        ref={searchBoxRef}
                    >
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">
                            Search &amp; Add Product
                        </h3>
                        <div className="relative">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                                placeholder="Type a product name or SKU..."
                                className="w-full rounded-lg border border-slate-200 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                            />

                            {showResults && productSearch.trim() && (
                                <div className="absolute z-10 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                    {searchResults.length === 0 ? (
                                        <p className="px-4 py-3 text-sm text-slate-400">
                                            No products match "{productSearch}"
                                        </p>
                                    ) : (
                                        searchResults.map((product) => (
                                            <button
                                                key={product._id}
                                                type="button"
                                                onClick={() =>
                                                    addProductToCart(
                                                        product._id,
                                                    )
                                                }
                                                disabled={
                                                    product.quantityInStock ===
                                                    0
                                                }
                                                className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-b border-slate-50 last:border-b-0"
                                            >
                                                <span className="font-medium text-slate-800">
                                                    {product.name}
                                                    <span className="text-slate-400 font-normal">
                                                        {" "}
                                                        · {product.sku}
                                                    </span>
                                                </span>
                                                <span className="text-xs text-slate-500 whitespace-nowrap ml-3">
                                                    ₹{product.sellingPrice} ·{" "}
                                                    {product.quantityInStock ===
                                                    0
                                                        ? "Out of stock"
                                                        : `${product.quantityInStock} in stock`}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                                    <th className="px-5 py-3 font-semibold">
                                        Product
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Qty
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Price
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Subtotal
                                    </th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {cart.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-10 text-center text-slate-400"
                                        >
                                            <ShoppingCart
                                                size={24}
                                                className="mx-auto mb-2 opacity-40"
                                            />
                                            Cart is empty — add a product above
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map((item) => {
                                        const product = getProduct(
                                            item.productId,
                                        );
                                        if (!product) return null;
                                        return (
                                            <tr
                                                key={item.productId}
                                                className="border-t border-slate-100"
                                            >
                                                <td className="px-5 py-3 font-medium text-slate-900">
                                                    {product.name}
                                                </td>
                                                <td className="px-5 py-3 text-slate-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                decrementQty(
                                                                    item.productId,
                                                                )
                                                            }
                                                            className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="w-6 text-center font-medium text-slate-800">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                incrementQty(
                                                                    item.productId,
                                                                )
                                                            }
                                                            disabled={
                                                                item.quantity >=
                                                                product.quantityInStock
                                                            }
                                                            title={
                                                                item.quantity >=
                                                                product.quantityInStock
                                                                    ? "No more stock available"
                                                                    : undefined
                                                            }
                                                            className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-slate-600">
                                                    ₹{product.sellingPrice}
                                                </td>
                                                <td className="px-5 py-3 font-medium text-slate-900">
                                                    ₹
                                                    {product.sellingPrice *
                                                        item.quantity}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() =>
                                                            removeFromCart(
                                                                item.productId,
                                                            )
                                                        }
                                                        className="text-slate-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 h-fit space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700">
                        Bill Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Discount (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Tax (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={tax}
                                onChange={(e) => setTax(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Payment Method *
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm bg-white capitalize"
                        >
                            {PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        {ONLINE_METHODS.includes(paymentMethod) && (
                            <p className="text-xs text-slate-400 mt-1.5">
                                A Razorpay payment window will open after you
                                click Complete Sale.
                            </p>
                        )}
                    </div>
                    <div className="border-t border-slate-100 pt-3 space-y-1.5">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{subTotal}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-slate-900 pt-1">
                            <span>Total</span>
                            <span>₹{grandTotal}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCompleteSale}
                        disabled={saving || cart.length === 0}
                        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
                    >
                        {saving ? "Processing..." : "Complete Sale"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Billing;
