import api from "./axios.js";

export const getCategories = () => api.get("/categories");
export const createCategory = (payload) => api.post("/categories", payload);
export const updateCategory = (id, payload) =>
    api.patch(`/categories/${id}`, payload);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
