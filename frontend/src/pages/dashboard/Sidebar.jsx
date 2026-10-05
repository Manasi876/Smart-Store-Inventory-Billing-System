import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Layers,
    Package,
    Warehouse,
    Receipt,
    History,
    LogOut,
    UserCircle,
    ShieldCheck,
    Users,
    Lock,
    Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { usePaymentLock } from "../../context/PaymentLockContext.jsx";

const NAV_ITEMS = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        end: true,
    },
    { label: "Categories", icon: Layers, path: "/dashboard/categories" },
    { label: "Products", icon: Package, path: "/dashboard/products" },
    { label: "Stock", icon: Warehouse, path: "/dashboard/stock" },
    { label: "Billing", icon: Receipt, path: "/dashboard/billing" },
    { label: "Invoice History", icon: History, path: "/dashboard/invoices" },
];

const ADMIN_NAV_ITEMS = [
    {
        label: "Staff Verification",
        icon: ShieldCheck,
        path: "/dashboard/verifications",
    },
    { label: "All Members", icon: Users, path: "/dashboard/members" },
];

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
    const { user, logout } = useAuth();
    const { isPaymentInProgress } = usePaymentLock();
    const navigate = useNavigate();

    const role = user?.role;

    const isAdmin = role === "admin";
    const isManager = role === "manager";
    const isStaff = role === "cashier" || role === "staff";
    const isEmployee = role === "employee";

    const handleLogout = () => {
        if (isPaymentInProgress) return;
        logout();
        navigate("/login");
    };

    const renderItem = ({ label, icon: Icon, path, end }) => {
        let locked = false;

        // A payment is actively in progress (Razorpay Checkout is open) -
        // lock EVERY nav item, including Billing itself, until it resolves.
        // This is checked before any role-based lock below.
        if (isPaymentInProgress) {
            locked = true;
        } else if (isStaff) {
            // Staff / Cashier → Only Billing is accessible
            locked = path !== "/dashboard/billing";
        } else if (isManager) {
            // Manager → Cannot access Dashboard, Staff Verification, All Members
            locked =
                path === "/dashboard" ||
                path === "/dashboard/verifications" ||
                path === "/dashboard/members";
        } else if (isEmployee) {
            // Employee → Cannot access any dashboard modules
            locked = true;
        }

        if (locked) {
            return (
                <div
                    key={label}
                    title={
                        isPaymentInProgress
                            ? "Finish the current payment before navigating away"
                            : undefined
                    }
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 cursor-not-allowed select-none"
                >
                    <Icon size={18} strokeWidth={1.75} />
                    <span className="text-sm font-medium">{label}</span>
                    <Lock size={13} strokeWidth={2} className="ml-auto" />
                </div>
            );
        }

        return (
            <NavLink
                key={label}
                to={path}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                            ? "bg-brand-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-brand-100/70 hover:text-brand-700"
                    }`
                }
            >
                <Icon size={18} strokeWidth={1.75} />
                <span>{label}</span>
            </NavLink>
        );
    };

    return (
        <>
            {/* Backdrop - mobile only, closes the drawer on tap */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-brand-50 border-r border-slate-200 flex flex-col px-4 py-6 min-h-screen transform transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0 lg:static`}
            >
                <div className="px-2 mb-8">
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                        StoreDesk POS
                    </h1>
                    <p className="text-xs font-medium text-slate-400 mt-0.5 capitalize">
                        {user?.role || "Guest"}
                    </p>
                </div>

                {isPaymentInProgress && (
                    <div className="flex items-center gap-2 px-3 py-2.5 mb-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">
                        <Loader2 size={14} className="animate-spin" />
                        Payment in progress...
                    </div>
                )}

                <nav className="flex flex-col gap-1">
                    {NAV_ITEMS.map(renderItem)}
                    {isAdmin && ADMIN_NAV_ITEMS.map(renderItem)}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-200 flex flex-col gap-1">
                    {isPaymentInProgress ? (
                        <div
                            title="Finish the current payment before navigating away"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 cursor-not-allowed select-none"
                        >
                            <UserCircle size={18} strokeWidth={1.75} />
                            <span className="text-sm font-medium">Profile</span>
                            <Lock
                                size={13}
                                strokeWidth={2}
                                className="ml-auto"
                            />
                        </div>
                    ) : (
                        <NavLink
                            to="/dashboard/profile"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-brand-600 text-white"
                                        : "text-slate-600 hover:bg-brand-100/70 hover:text-brand-700"
                                }`
                            }
                        >
                            <UserCircle size={18} strokeWidth={1.75} />
                            <span>Profile</span>
                        </NavLink>
                    )}

                    <button
                        onClick={handleLogout}
                        disabled={isPaymentInProgress}
                        title={
                            isPaymentInProgress
                                ? "Finish the current payment before logging out"
                                : undefined
                        }
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors mt-1"
                    >
                        <LogOut size={18} strokeWidth={1.75} />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
