import apiClient from "../api/client";
import posDb from "../db/posDatabase";

/**
 * Product & Inventory Catalog Service (Offline-First)
 * Mirrors remote MongoDB catalog to local Dexie IndexedDB
 * for 100% resilient local retail operation.
 */
export const productService = {
  async getProducts() {
    // If browser detects offline mode immediately, read from local IndexedDB
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const localProducts = await posDb.getAllLocalProducts();
      return localProducts;
    }

    try {
      const response = await apiClient.get("/items/get-item");
      const items = Array.isArray(response.data) ? response.data : [];

      // Asynchronously mirror catalog to local IndexedDB
      posDb.bulkUpsertProducts(items).catch((err) => {
        console.warn("[ProductService] Local cache update warning:", err);
      });

      return items;
    } catch (networkError) {
      console.warn("[ProductService] Network failed, falling back to local IndexedDB catalog:", networkError.message);
      const localProducts = await posDb.getAllLocalProducts();
      return localProducts;
    }
  },

  async addProduct(payload) {
    try {
      const response = await apiClient.post("/items/add-item", payload);
      const created = response.data;
      if (created) {
        await posDb.products.put({
          _id: String(created._id || created.id),
          name: created.name,
          category: created.category,
          price: Number(created.price || 0),
          purchasePrice: Number(created.purchasePrice || 0),
          stock: Number(created.stock || 0),
          barcode: created.barcode ? String(created.barcode).trim() : "",
          image: created.image || "",
          dealers: created.dealers || "",
          updatedAt: new Date().toISOString(),
        });
      }
      return response.data;
    } catch (error) {
      // If offline, create locally
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const localId = `LOCAL-${Date.now()}`;
        const localProduct = { ...payload, _id: localId, isLocal: true };
        await posDb.products.put(localProduct);
        return localProduct;
      }
      throw error;
    }
  },

  async editProduct(payload) {
    try {
      const response = await apiClient.put("/items/edit-item", payload);
      const id = String(payload._id || payload.itemId);
      if (id) {
        await posDb.products.update(id, payload);
      }
      return response.data;
    } catch (error) {
      const id = String(payload._id || payload.itemId);
      if (id) {
        await posDb.products.update(id, payload);
        return payload;
      }
      throw error;
    }
  },

  async deleteProduct(itemId) {
    try {
      const response = await apiClient.post("/items/delete-item", { itemId });
      await posDb.products.delete(String(itemId));
      return response.data;
    } catch (error) {
      await posDb.products.delete(String(itemId));
      return { success: true, offlineDeleted: true };
    }
  },
};

export default productService;
