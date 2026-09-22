import apiClient from "../api/client";

/**
 * User & Operator Management Service (Admin)
 * Encapsulates all API communication for user administration.
 */
export const userService = {
  async getUsers() {
    try {
      const response = await apiClient.get("/users/get-users");
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      const fallback = await apiClient.get("/users/all");
      return Array.isArray(fallback.data) ? fallback.data : [];
    }
  },

  async createUser(payload) {
    const response = await apiClient.post("/users/admin-create", payload);
    return response.data;
  },

  async toggleStatus(userId, active) {
    const response = await apiClient.patch("/users/toggle-status", { userId, active });
    return response.data;
  },

  async updateRole(userId, role) {
    const response = await apiClient.patch("/users/update-role", { userId, role });
    return response.data;
  },

  async deleteUser(userId) {
    const response = await apiClient.delete(`/users/delete/${userId}`);
    return response.data;
  },
};

export default userService;
