import api from "./axios.js";

export const getMyProfile = () => api.get("/users/profile");

export const updateMyAvatar = (formData) =>
    api.patch("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const submitVerificationDocuments = (formData) =>
    api.post("/users/verify-documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const getPendingVerifications = () =>
    api.get("/users/verifications/pending");

export const reviewVerification = (userId, decision) =>
    api.patch(`/users/verifications/${userId}/review`, { decision });

export const getMembers = () => api.get("/users/members");
export const getMemberById = (userId) => api.get(`/users/members/${userId}`);
export const deleteMember = (userId) => api.delete(`/users/members/${userId}`);

export const assignManagerRole = (username) => {
    return api.patch(`/users/${username}/assign-manager`);
};

export const removeManagerRole = (username) => {
    return api.patch(
        `/users/${username}/remove-manager`,
    );
};