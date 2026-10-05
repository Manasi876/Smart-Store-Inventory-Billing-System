import { useEffect, useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
import { getProducts, restockProduct } from "../../api/product.api.js";
import Modal from "../../components/Modal.jsx";
import SearchBar from "../../components/SearchBar.jsx";

const Stock = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [restockTarget, setRestockTarget] = useState(null);
    const [quantity, setQuantity] = useState("");
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    const filteredProducts = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return products;
        return products.filter(
            (product) =>
                product.name?.toLowerCase().includes(term) ||
                product.sku?.toLowerCase().includes(term),
        );
    }, [products, searchTerm]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await getProducts();
            setProducts(data.data);
        } catch (err) {
            setError(
                err.response?.data?.message || "Stock data load nahi ho paaya",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const openRestockModal = (product) => {
        setRestockTarget(product);
        setQuantity("");
        setFormError("");
    };

    const handleRestock = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError("");
        try {
            await restockProduct(restockTarget._id, quantity);
            setRestockTarget(null);
            fetchProducts();
        } catch (err) {
            setFormError(err.response?.data?.message || "Restock fail ho gaya");
        } finally {
            setSaving(false);
        }
    };

    const lowStockCount = products.filter(
        (p) => p.quantityInStock <= p.reorderLevel,
    ).length;

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Stock</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {lowStockCount > 0
                            ? `${lowStockCount} product(s) reorder level se neeche hain`
                            : "Saara stock healthy level pe hai"}
                    </p>
                </div>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search stock by product or SKU..."
                />
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                    <thead>
                        <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="px-6 py-3 font-semibold">Product</th>
                            <th className="px-6 py-3 font-semibold">
                                Current Stock
                            </th>
                            <th className="px-6 py-3 font-semibold">
                                Reorder Level
                            </th>
                            <th className="px-6 py-3 font-semibold text-right">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-8 text-center text-slate-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-8 text-center text-slate-400"
                                >
                                    {searchTerm
                                        ? "No products match your search"
                                        : "Koi product nahi hai abhi tak"}
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => {
                                const isLow =
                                    product.quantityInStock <=
                                    product.reorderLevel;
                                return (
                                    <tr
                                        key={product._id}
                                        className={`border-t border-slate-100 ${isLow ? "bg-red-50/40" : "hover:bg-slate-50/60"}`}
                                    >
                                        <td className="px-6 py-3.5 font-medium text-slate-900">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span
                                                className={
                                                    isLow
                                                        ? "text-red-500 font-semibold"
                                                        : "text-slate-700"
                                                }
                                            >
                                                {product.quantityInStock}{" "}
                                                {product.unit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-500">
                                            {product.reorderLevel}{" "}
                                            {product.unit}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() =>
                                                        openRestockModal(
                                                            product,
                                                        )
                                                    }
                                                    className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 text-xs font-semibold"
                                                >
                                                    <PackagePlus size={14} />
                                                    Restock
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {restockTarget && (
                <Modal
                    title={`Restock — ${restockTarget.name}`}
                    onClose={() => setRestockTarget(null)}
                >
                    <form onSubmit={handleRestock} className="space-y-4">
                        <p className="text-sm text-slate-500">
                            Current stock:{" "}
                            <span className="font-semibold text-slate-900">
                                {restockTarget.quantityInStock}{" "}
                                {restockTarget.unit}
                            </span>
                        </p>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Quantity to add
                            </label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="e.g. 50"
                                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                            />
                        </div>

                        {formError && (
                            <p className="text-sm text-red-500">{formError}</p>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
                        >
                            {saving ? "Updating..." : "Add Stock"}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Stock;
