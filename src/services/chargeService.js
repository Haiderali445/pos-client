import apiClient from "../api/client";

/**
 * Store Expenses & Charges Service
 * Encapsulates all API communication for store charges.
 */
export const chargeService = {
  async getCharges() {
    const response = await apiClient.get("/charges/get-charges");
    return Array.isArray(response.data) ? response.data : [];
  },

  async addCharge(payload) {
    const response = await apiClient.post("/charges/add-charge", payload);
    return response.data;
  },

  async editCharge(payload) {
    const response = await apiClient.put("/charges/edit-charge", payload);
    return response.data;
  },

  async deleteCharge(chargeId) {
    const response = await apiClient.post("/charges/delete-charge", { chargeId });
    return response.data;
  },
};

export default chargeService;
