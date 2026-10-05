import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../../api/product.api.js";
import { getCategories } from "../../api/category.api.js";
import { generateDescription } from "../../api/ai.api.js";
import Modal from "../../components/Modal.jsx";
import SearchBar from "../../components/SearchBar.jsx";

const emptyForm = {
    name: "",
    description: "",
    sku: "",
    category: "",
    unit: "pcs",
    purchasePrice: "",
    sellingPrice: "",
    quantityInStock: "",
    reorderLevel: "10",
};

const UNITS = ["pcs", "kg", "gram", "litre", "ml", "box", "packet"];

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProducts = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return products;
        return products.filter(
            (product) =>
                product.name?.toLowerCase().includes(term) ||
                product.sku?.toLowerCase().includes(term) ||
                product.category?.name?.toLowerCase().includes(term),
        );
    }, [products, searchTerm]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                getProducts(),
                getCategories(),
            ]);
            setProducts(productsRes.data.data);
            setCategories(categoriesRes.data.data);
        } catch (err) {
            setError(
                err.response?.data?.message || "Products load nahi ho paaye",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const openCreateModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormError("");
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingId(product._id);
        setForm({
            name: product.name,
            description: product.description || "",
            sku: product.sku,
            category: product.category?._id || "",
            unit: product.unit,
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            quantityInStock: product.quantityInStock,
            reorderLevel: product.reorderLevel,
        });
        setFormError("");
        setShowModal(true);
    };

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    // Calls our backend AI endpoint (which itself calls Groq). Does
    // nothing if the name field is empty - no API call is made in that case.
    const handleGenerateDescription = async () => {
        if (!form.name.trim()) return;

        setGenerating(true);
        setFormError("");
        try {
            const { data } = await generateDescription(form.name, "product");
            setForm((prev) => ({
                ...prev,
                description: data.data.description,
            }));
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                    "Could not generate a description",
            );
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError("");
        try {
            if (editingId) {
                await updateProduct(editingId, form);
            } else {
                await createProduct(form);
            }
            setShowModal(false);
            fetchAll();
        } catch (err) {
            setFormError(err.response?.data?.message || "Kuch galat ho gaya");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`"${product.name}" product delete karna hai?`))
            return;
        try {
            await deleteProduct(product._id);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || "Delete nahi ho paaya");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Products
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Inventory ke products manage karo
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search products, SKU, category..."
                    />
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} />
                        Add Product
                    </button>
                </div>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="px-6 py-3 font-semibold">Name</th>
                            <th className="px-6 py-3 font-semibold">SKU</th>
                            <th className="px-6 py-3 font-semibold">
                                Category
                            </th>
                            <th className="px-6 py-3 font-semibold">
                                Purchase
                            </th>
                            <th className="px-6 py-3 font-semibold">Selling</th>
                            <th className="px-6 py-3 font-semibold">Stock</th>
                            <th className="px-6 py-3 font-semibold text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-8 text-center text-slate-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-8 text-center text-slate-400"
                                >
                                    {searchTerm
                                        ? "No products match your search"
                                        : "Koi product nahi hai abhi tak"}
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr
                                    key={product._id}
                                    className="border-t border-slate-100 hover:bg-slate-50/60"
                                >
                                    <td className="px-6 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-500">
                                        {product.sku}
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-500">
                                        {product.category?.name || "—"}
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-500">
                                        ₹{product.purchasePrice}
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-500">
                                        ₹{product.sellingPrice}
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span
                                            className={
                                                product.quantityInStock <=
                                                product.reorderLevel
                                                    ? "text-red-500 font-semibold"
                                                    : "text-slate-700"
                                            }
                                        >
                                            {product.quantityInStock}{" "}
                                            {product.unit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() =>
                                                    openEditModal(product)
                                                }
                                                className="text-slate-400 hover:text-brand-600 transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(product)
                                                }
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal
                    title={editingId ? "Edit Product" : "Add Product"}
                    onClose={() => setShowModal(false)}
                >
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-3 max-h-[65vh] overflow-y-auto pr-1"
                    >
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Name
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                SKU
                            </label>
                            <input
                                name="sku"
                                value={form.sku}
                                onChange={handleChange}
                                required
                                placeholder="BEV-COKE-500"
                                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Category
                            </label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition bg-white"
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Unit
                                </label>
                                <select
                                    name="unit"
                                    value={form.unit}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition bg-white"
                                >
                                    {UNITS.map((u) => (
                                        <option key={u} value={u}>
                                            {u}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Reorder Level
                                </label>
                                <input
                                    name="reorderLevel"
                                    value={form.reorderLevel}
                                    onChange={handleChange}
                                    type="number"
                                    min="0"
                                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Purchase Price
                                </label>
                                <input
                                    name="purchasePrice"
                                    value={form.purchasePrice}
                                    onChange={handleChange}
                                    type="number"
                                    min="0"
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Selling Price
                                </label>
                                <input
                                    name="sellingPrice"
                                    value={form.sellingPrice}
                                    onChange={handleChange}
                                    type="number"
                                    min="0"
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                                />
                            </div>
                        </div>

                        {!editingId && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Opening Stock
                                </label>
                                <input
                                    name="quantityInStock"
                                    value={form.quantityInStock}
                                    onChange={handleChange}
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                                />
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-slate-600">
                                    Description
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={!form.name.trim() || generating}
                                    title={
                                        !form.name.trim()
                                            ? "Enter a name first"
                                            : "Generate description with AI"
                                    }
                                    className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Sparkles size={13} />
                                    {generating
                                        ? "Generating..."
                                        : "Generate Description"}
                                </button>
                            </div>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={2}
                                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition resize-none"
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
                            {saving
                                ? "Saving..."
                                : editingId
                                  ? "Update Product"
                                  : "Create Product"}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Products;
