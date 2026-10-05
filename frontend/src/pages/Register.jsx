import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
    const { register, loading, error } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        username: "",
        mobile: "",
        password: "",
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) =>
                formData.append(key, value),
            );
            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            await register(formData);
            navigate("/dashboard");
        } catch {
            // error already AuthContext ke andar set ho chuka hai
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4 py-10">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        StoreDesk POS
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Naya employee account banao
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm shadow-slate-200/50 space-y-4"
                >
                    <div className="flex flex-col items-center mb-2">
                        <label htmlFor="avatar" className="cursor-pointer">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="w-16 h-16 rounded-full object-cover border border-slate-200"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-brand-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                    <UserCircle size={28} />
                                </div>
                            )}
                        </label>
                        <input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        <span className="text-xs text-slate-400 mt-1.5">
                            Avatar (optional)
                        </span>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Full Name
                        </label>
                        <input
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            type="text"
                            required
                            placeholder="Rahul Sharma"
                            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Email
                        </label>
                        <input
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            type="email"
                            required
                            placeholder="rahul@store.com"
                            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Mobile Number
                        </label>
                        <input
                            name="mobile"
                            value={form.mobile}
                            onChange={handleChange}
                            type="tel"
                            required
                            placeholder="9876543210"
                            maxLength={10}
                            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Username
                        </label>
                        <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            type="text"
                            required
                            placeholder="rahul123"
                            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Password
                        </label>
                        <input
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                        />
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                        Registration ke baad tumhara account "Employee" role se banega.
                        Staff banne ke liye profile section se Aadhar aur PAN submit karna hoga.
                    </p>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg py-2.5 transition-colors mt-2"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already ho account?{" "}
                    <Link
                        to="/login"
                        className="text-brand-600 font-semibold hover:underline"
                    >
                        Log in karo
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
