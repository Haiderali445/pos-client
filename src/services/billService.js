import apiClient from "../api/client";
import posDb from "../db/posDatabase";

/**
 * Bill & Invoice Management Service (Offline-Capable)
 * Handles dual-mode checkout: transparent online persistence with
 * automatic offline queuing into IndexedDB and instant local stock decrement.
 */
export const billService = {
  async getBills() {
    let remoteBills = [];
    let isOfflineMode = false;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      isOfflineMode = true;
    } else {
      try {
        const response = await apiClient.get("/bill/get-bill");
        remoteBills = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.warn("[BillService] Remote bills fetch failed, using local offline records:", err.message);
        isOfflineMode = true;
      }
    }

    if (isOfflineMode) {
      return await posDb.getAllLocalBills();
    }

    // Merge pending offline bills at the top so cashier sees newly created offline sales
    try {
      const pendingBills = await posDb.getPendingBills();
      if (pendingBills.length > 0) {
        return [...pendingBills, ...remoteBills];
      }
    } catch (e) {
      // Ignore local read errors
    }

    return remoteBills;
  },

  async createBill(payload) {
    // If offline detected, immediately save to local offline queue
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const offlineBill = await posDb.saveOfflineBill(payload);
      return offlineBill;
    }

    try {
      const response = await apiClient.post("/bill/add-bill", payload);

      // Decrement local IndexedDB stock to keep local cache synchronized with server checkout
      posDb.decrementLocalStock(payload.cartItems).catch((err) => {
        console.warn("[BillService] Local stock decrement warning:", err);
      });

      return response.data;
    } catch (networkError) {
      console.warn("[BillService] Network error during checkout. Queuing invoice into IndexedDB:", networkError.message);
      const offlineBill = await posDb.saveOfflineBill(payload);
      return offlineBill;
    }
  },

  async editBill(payload) {
    const response = await apiClient.put("/bill/edit-bill", payload);
    return response.data;
  },

  async deleteBill(billId) {
    // If it is a local offline bill, remove from local queue
    if (String(billId).startsWith("OFFLINE-")) {
      await posDb.offline_bills.delete(String(billId));
      return { success: true, offlineDeleted: true };
    }

    const response = await apiClient.delete(`/bill/delete-bill/${billId}`);
    return response.data;
  },
};

export default billService;
