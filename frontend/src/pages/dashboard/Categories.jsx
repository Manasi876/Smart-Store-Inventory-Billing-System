import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../../api/category.api.js";
import { generateDescription } from "../../api/ai.api.js";
import Modal from "../../components/Modal.jsx";
import SearchBar from "../../components/SearchBar.jsx";

const emptyForm = { name: "", description: "" };

const Categories = () => {
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

    const filteredCategories = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return categories;
        return categories.filter(
            (category) =>
                category.name?.toLowerCase().includes(term) ||
                category.description?.toLowerCase().includes(term),
        );
    }, [categories, searchTerm]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data } = await getCategories();
            setCategories(data.data);
        } catch (err) {
            setError(
                err.response?.data?.message || "Categories load nahi ho paayi",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openCreateModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormError("");
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setEditingId(category._id);
        setForm({
            name: category.name,
            description: category.description || "",
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
            const { data } = await generateDescription(form.name, "category");
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
                await updateCategory(editingId, form);
            } else {
                await createCategory(form);
            }
            setShowModal(false);
            fetchCategories();
        } catch (err) {
            setFormError(err.response?.data?.message || "Kuch galat ho gaya");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`"${category.name}" category delete karna hai?`))
            return;
        try {
            await deleteCategory(category._id);
            fetchCategories();
        } catch (err) {
            alert(err.response?.data?.message || "Delete nahi ho paaya");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Categories
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Product categories manage karo
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search categories..."
                    />
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} />
                        Add Category
                    </button>
                </div>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                    <thead>
                        <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="px-6 py-3 font-semibold">Name</th>
                            <th className="px-6 py-3 font-semibold">
                                Description
                            </th>
                            <th className="px-6 py-3 font-semibold text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-8 text-center text-slate-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredCategories.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-8 text-center text-slate-400"
                                >
                                    {searchTerm
                                        ? "No categories match your search"
                                        : "Koi category nahi hai abhi tak"}
                                </td>
                            </tr>
                        ) : (
                            filteredCategories.map((category) => (
                                <tr
                                    key={category._id}
                                    className="border-t border-slate-100 hover:bg-slate-50/60"
                                >
                                    <td className="px-6 py-3.5 font-medium text-slate-900">
                                        {category.name}
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-500">
                                        {category.description || "—"}
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() =>
                                                    openEditModal(category)
                                                }
                                                className="text-slate-400 hover:text-brand-600 transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(category)
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
                    title={editingId ? "Edit Category" : "Add Category"}
                    onClose={() => setShowModal(false)}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Name
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder="Beverages"
                                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                            />
                        </div>
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
                                rows={3}
                                placeholder="Cold drinks, juices, water bottles"
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
                                  ? "Update Category"
                                  : "Create Category"}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Categories;
