import apiClient from "../api/client";

/**
 * Product & Inventory Catalog Service
 * Encapsulates all API communication for products/items.
 */
export const productService = {
  async getProducts() {
    const response = await apiClient.get("/items/get-item");
    return Array.isArray(response.data) ? response.data : [];
  },

  async addProduct(payload) {
    const response = await apiClient.post("/items/add-item", payload);
    return response.data;
  },

  async editProduct(payload) {
    const response = await apiClient.put("/items/edit-item", payload);
    return response.data;
  },

  async deleteProduct(itemId) {
    const response = await apiClient.post("/items/delete-item", { itemId });
    return response.data;
  },
};

export default productService;
