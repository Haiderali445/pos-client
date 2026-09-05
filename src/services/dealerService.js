import apiClient from "../api/client";

/**
 * Dealer & Vendor Service
 * Encapsulates all API communication for suppliers and dealers.
 */
export const dealerService = {
  async getDealers() {
    const response = await apiClient.get("/dealers/get-dealers");
    return Array.isArray(response.data) ? response.data : [];
  },

  async addDealer(payload) {
    const response = await apiClient.post("/dealers/add-dealer", payload);
    return response.data;
  },

  async editDealer(payload) {
    const response = await apiClient.put("/dealers/edit-dealer", payload);
    return response.data;
  },

  async deleteDealer(dealerId) {
    const response = await apiClient.post("/dealers/delete-dealer", { dealerId });
    return response.data;
  },
};

export default dealerService;
