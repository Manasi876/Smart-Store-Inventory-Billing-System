import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from './ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import './styles.css';

import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Categories from "./pages/dashboard/Categories.jsx";
import Products from "./pages/dashboard/Products.jsx";
import Stock from "./pages/dashboard/Stock.jsx";
import Billing from "./pages/dashboard/Billing.jsx";
import InvoiceHistory from "./pages/dashboard/InvoiceHistory.jsx";
import Profile from "./pages/dashboard/Profile.jsx";
import Verifications from "./pages/dashboard/Verifications.jsx";
import { Overview } from "./pages/dashboard/sections.jsx";
import Members from "./pages/dashboard/Members.jsx";

function App() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route
                path="/"
                element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Overview />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="stock" element={<Stock />} />
                <Route path="billing" element={<Billing />} />
                <Route path="invoices" element={<InvoiceHistory />} />
                <Route path="profile" element={<Profile />} />
                <Route path="verifications" element={<Verifications />} />
                <Route path="members" element={<Members />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
