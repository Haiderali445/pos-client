import apiClient from "../api/client";

/**
 * Bill & Invoice Management Service
 * Encapsulates all API communication for billing, invoicing, and checkout.
 */
export const billService = {
  async getBills() {
    const response = await apiClient.get("/bill/get-bill");
    return Array.isArray(response.data) ? response.data : [];
  },

  async createBill(payload) {
    const response = await apiClient.post("/bill/add-bill", payload);
    return response.data;
  },

  async editBill(payload) {
    const response = await apiClient.put("/bill/edit-bill", payload);
    return response.data;
  },

  async deleteBill(billId) {
    const response = await apiClient.delete(`/bill/delete-bill/${billId}`);
    return response.data;
  },
};

export default billService;
