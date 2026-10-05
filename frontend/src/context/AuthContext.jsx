import { createContext, useContext, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const persistSession = (loggedInUser, accessToken) => {
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        localStorage.setItem("accessToken", accessToken);
        setUser(loggedInUser);
    };

    const login = async ({ identifier, password }) => {
        setLoading(true);
        setError("");
        try {
            // identifier email hai ya username, dono se login chalega
            const isEmail = identifier.includes("@");
            const payload = isEmail
                ? { email: identifier, password }
                : { username: identifier, password };

            const { data } = await api.post("/users/login", payload);
            const { user: loggedInUser, accessToken } = data.data;

            persistSession(loggedInUser, accessToken);
            return loggedInUser;
        } catch (err) {
            const message = err.response?.data?.message || "Login failed";
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const register = async (formData) => {
        setLoading(true);
        setError("");
        try {
            // formData FormData instance hai (fullName, email, username, password, mobile, avatar file)
            await api.post("/users/register", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const username = formData.get("username");
            const password = formData.get("password");

            // Register khud login nahi karwata (backend design ke hisaab se),
            // isliye register hote hi turant login bhi kar dete hain seedha
            return await login({ identifier: username, password });
        } catch (err) {
            const message =
                err.response?.data?.message || "Registration failed";
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    // Profile/verification update ke baad local user state refresh karne ke liye
    const updateUser = (updatedUser) => {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const refreshAccessToken = async () => {
        try {
            const { data } = await api.post("/users/refresh-token");

            const { accessToken } = data.data;

            localStorage.setItem("accessToken", accessToken);

            return accessToken;
        } catch (err) {
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            setUser(null);
            throw err;
        }
    };

    const logout = async () => {
        try {
            await api.post("/users/logout");
        } catch (err) {
            console.error(err);
        } finally {
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                refreshAccessToken,
                updateUser,
                loading,
                error,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
