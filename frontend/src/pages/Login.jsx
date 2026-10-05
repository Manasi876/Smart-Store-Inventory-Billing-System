import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      navigate("/dashboard");
    } catch {
      // error already AuthContext ke andar set ho chuka hai, UI mein dikh jaayega
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            StoreDesk POS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Apne store account mein login karo
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm shadow-slate-200/50 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Username or Email
            </label>
            <input
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              type="text"
              required
              placeholder="rahul123 or rahul@store.com"
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Naye ho?{" "}
          <Link
            to="/register"
            className="text-brand-600 font-semibold hover:underline"
          >
            Account banao
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
