import axios from "axios";

/*
  Ek hi jagah se axios configure kar rahe hain, taaki baseURL aur
  auth header har request mein manually na likhna pade.
*/
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  withCredentials: true, // cookies (accessToken/refreshToken) bhi bhej dega agar backend set karta hai
});

// Har request ke saath accessToken header mein bhi bhej do (localStorage se)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
