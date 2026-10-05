import { useState } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const LOCKED_FOR_STAFF = [
    "/dashboard",
    "/dashboard/categories",
    "/dashboard/products",
    "/dashboard/stock",
    "/dashboard/invoices",
    "/dashboard/verifications",
    "/dashboard/members",
];

const LOCKED_FOR_EMPLOYEE = [
    "/dashboard",
    "/dashboard/categories",
    "/dashboard/products",
    "/dashboard/stock",
    "/dashboard/billing",
    "/dashboard/invoices",
    "/dashboard/verifications",
    "/dashboard/members",
];

const LOCKED_FOR_MANAGER = [
    "/dashboard",
    "/dashboard/verifications",
    "/dashboard/members",
];

// Default allowed route per role
const DEFAULT_ROUTE = {
    staff: "/dashboard/billing",
    cashier: "/dashboard/billing",
    manager: "/dashboard/billing",
    employee: "/dashboard/profile",
};

const DashboardLayout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!user) return <Navigate to="/login" replace />;

    const role = user?.role;

    if (
        (role === "cashier" || role === "staff") &&
        LOCKED_FOR_STAFF.includes(location.pathname)
    ) {
        return <Navigate to={DEFAULT_ROUTE[role]} replace />;
    }

    if (role === "manager" && LOCKED_FOR_MANAGER.includes(location.pathname)) {
        return <Navigate to={DEFAULT_ROUTE[role]} replace />;
    }

    if (
        role === "employee" &&
        LOCKED_FOR_EMPLOYEE.includes(location.pathname)
    ) {
        return <Navigate to={DEFAULT_ROUTE[role]} replace />;
    }

    return (
        <div className="flex min-h-screen bg-brand-50">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile-only top bar - hidden from lg upward, since the
                    sidebar is always visible there and this bar would be
                    redundant. */}
                <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        <Menu size={22} />
                    </button>
                    <h1 className="text-base font-bold text-slate-900">
                        StoreDesk POS
                    </h1>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
