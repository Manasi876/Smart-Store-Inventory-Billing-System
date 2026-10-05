import api from "./axios.js";

// type must be "category" or "product"
export const generateDescription = (name, type) =>
    api.post("/ai/generate-description", { name, type });
