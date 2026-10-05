import api from "./axios.js";

export const getProducts = () => api.get("/products");
export const createProduct = (payload) => api.post("/products", payload);
export const updateProduct = (id, payload) =>
    api.patch(`/products/${id}`, payload);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const restockProduct = (id, quantity) =>
    api.patch(`/products/${id}/restock`, { quantity });
