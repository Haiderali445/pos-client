import apiClient from "../api/client";
import posDb from "../db/posDatabase";

/**
 * Background Sync Engine for Hardware Point POS
 * Automatically reconciles offline transactions when network connectivity is detected.
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
   * Pushes all locally queued offline transactions to the remote server API.
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
        const { id, _id, isOffline, syncStatus, retryCount, createdAt, ...remotePayload } = bill;

        const response = await apiClient.post("/bill/add-bill", remotePayload);
        await posDb.markBillSynced(bill.id, response.data);
        syncedCount++;
      } catch (error) {
        console.error(`[SyncEngine] Failed to sync offline invoice ${bill.id}:`, error);
        failedCount++;
        // Increment retry count
        await posDb.offline_bills.update(bill.id, {
          retryCount: (bill.retryCount || 0) + 1,
          lastError: error.message || "Network transmission failed",
        });
      }
    }

    this.isSyncing = false;
    this.dispatchStatus({ action: "completed", synced: syncedCount, failed: failedCount });

    // Refresh products catalog in background to synchronize exact server stock
    if (syncedCount > 0) {
      this.refreshServerCatalog();
    }

    return { synced: syncedCount, failed: failedCount };
  }

  async refreshServerCatalog() {
    try {
      const res = await apiClient.get("/items/get-item");
      if (Array.isArray(res.data)) {
        await posDb.bulkUpsertProducts(res.data);
      }
    } catch (err) {
      // Silently ignore catalog refresh failures
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export const syncEngine = new SyncEngine();
export default syncEngine;
