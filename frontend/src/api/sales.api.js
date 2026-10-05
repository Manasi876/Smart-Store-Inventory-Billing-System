import api from "./axios.js";

export const getSales = () => api.get("/sales");
export const getSaleById = (id) => api.get(`/sales/${id}`);
export const createSale = (payload) => api.post("/sales", payload);
export const verifyPayment = (payload) => api.post("/payments/verify", payload);
export const cancelSale = (saleId) => api.patch(`/sales/${saleId}/cancel`);
export const getPaymentConfig = () => api.get("/payments/config");
