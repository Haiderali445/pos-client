import apiClient from "../api/client";
import posDb from "../db/posDatabase";

/**
 * Background Sync Engine for Hardware Point POS
 * Automatically reconciles offline transactions, customer Khata ledgers, and product inventory
 * when network connectivity is restored.
 */
class SyncEngine {
  constructor() {
    this.isSyncing = false;
    this.intervalId = null;
    this.initListeners();
  }

  initListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.info("[SyncEngine] Network connectivity restored. Initiating auto-sync...");
      this.syncPendingBills();
      this.refreshAllCaches();
    });

    window.addEventListener("offline", () => {
      console.warn("[SyncEngine] Network connection lost. Terminal operating in local offline mode.");
      this.dispatchStatus();
    });

    // Periodic check every 45 seconds if online
    this.intervalId = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncPendingBills({ silent: true });
      }
    }, 45000);
  }

  dispatchStatus(extra = {}) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("pos:sync-status", {
          detail: {
            isOnline: navigator.onLine,
            isSyncing: this.isSyncing,
            ...extra,
          },
        })
      );
    }
  }

  /**
   * Pushes all locally queued offline transactions to the remote server API,
   * including credit sales, delivery fares, and customer Khata references.
   * @param {Object} [options]
   * @param {boolean} [options.silent=false]
   * @returns {Promise<{ synced: number, failed: number }>}
   */
  async syncPendingBills(options = { silent: false }) {
    if (!navigator.onLine || this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    const pendingBills = await posDb.getPendingBills();
    if (pendingBills.length === 0) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.dispatchStatus({ action: "started", count: pendingBills.length });

    let syncedCount = 0;
    let failedCount = 0;

    for (const bill of pendingBills) {
      try {
        // Strip client-only offline markers before sending to MongoDB
        const {
          id,
          _id,
          isOffline,
          syncStatus,
          retryCount,
          createdAt,
          syncedAt,
          remoteId,
          lastError,
          ...remotePayload
        } = bill;

        const cleanPayload = {
          ...remotePayload,
          invoiceType: remotePayload.invoiceType || "Sale",
          accountId: remotePayload.accountId || null,
          fare: Number(remotePayload.fare || 0),
          totalDiscount: Number(remotePayload.totalDiscount || 0),
          totalAmount: Number(remotePayload.totalAmount || 0),
          paidAmount: Number(remotePayload.paidAmount || 0),
        };

        const response = await apiClient.post("/bill/add-bill", cleanPayload);
        await posDb.markBillSynced(bill.id, response.data);
        syncedCount++;
      } catch (error) {
        console.error(`[SyncEngine] Failed to sync offline invoice ${bill.id}:`, error);
        failedCount++;
        await posDb.offline_bills.update(bill.id, {
          retryCount: (bill.retryCount || 0) + 1,
          lastError: error.response?.data?.error || error.message || "Network transmission failed",
        });
      }
    }

    this.isSyncing = false;
    this.dispatchStatus({ action: "completed", synced: syncedCount, failed: failedCount });

    // Refresh products catalog & customer accounts to reconcile exact server state
    if (syncedCount > 0) {
      await this.refreshAllCaches();
    }

    return { synced: syncedCount, failed: failedCount };
  }

  /**
   * Re-syncs product catalog & FIFO stock batches from server into local IndexedDB
   */
  async refreshServerCatalog() {
    try {
      const res = await apiClient.get("/items/get-item");
      if (Array.isArray(res.data)) {
        await posDb.bulkUpsertProducts(res.data);
      }
    } catch (err) {
      console.warn("[SyncEngine] Failed to refresh local catalog cache:", err.message);
    }
  }

  /**
   * Re-syncs Customer Khata accounts directory and balances into local IndexedDB
   */
  async refreshServerAccounts() {
    try {
      const res = await apiClient.get("/accounts", { params: { type: "Customer" } });
      if (Array.isArray(res.data)) {
        await posDb.bulkUpsertAccounts(res.data);
      }
    } catch (err) {
      console.warn("[SyncEngine] Failed to refresh local accounts cache:", err.message);
    }
  }

  /**
   * Re-aligns all local caches with server state
   */
  async refreshAllCaches() {
    return Promise.allSettled([this.refreshServerCatalog(), this.refreshServerAccounts()]);
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export const syncEngine = new SyncEngine();
export default syncEngine;
