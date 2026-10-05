import { useEffect, useState } from "react";
import { Banknote, CreditCard, Smartphone, Globe2, WalletCards } from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";

const PageHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
);

const StatCard = ({ label, value }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
);

const PAYMENT_CARDS = [
    { key: "cash", label: "Cash Credited", icon: Banknote },
    { key: "card", label: "Card Credited", icon: CreditCard },
    { key: "upi", label: "UPI Credited", icon: Smartphone },
    { key: "netbanking", label: "Net Banking Credited", icon: Globe2 },
    { key: "wallet", label: "Wallet Credited", icon: WalletCards },
];

export const Overview = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { data } = await api.get("/users/dashboard");
                setStats(data.data);
            } catch (err) {
                setError(err.response?.data?.message || "Dashboard data could not be loaded");
            }
        };
        fetchDashboard();
    }, []);

    return (
        <div>
            <PageHeader title={`Welcome back, ${user?.fullName?.split(" ")[0] || "User"}`} subtitle="Store performance overview" />
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Sales" value={stats?.totalSalesCount ?? "—"} />
                <StatCard label="Total Revenue" value={stats ? `₹${stats.totalRevenue}` : "—"} />
                <StatCard label="Recent Bills" value={stats?.recentSales?.length ?? "—"} />
            </div>

            <div className="mt-8">
                <div className="mb-4"><h3 className="text-lg font-bold text-slate-900">Payment Method Credits</h3><p className="text-sm text-slate-500 mt-1">Total amount credited through each payment method</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {PAYMENT_CARDS.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Icon size={18} /></div>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-4">{label}</p>
                            <p className="text-xl font-bold text-slate-900 mt-1">₹{stats?.paymentMethodTotals?.[key] ?? 0}</p>
                            <p className="text-xs text-slate-400 mt-1">{stats?.paymentMethodCounts?.[key] ?? 0} transaction(s)</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
