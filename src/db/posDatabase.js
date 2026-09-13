import Dexie from "dexie";

/**
 * PosTerminalDB - Enterprise Offline-First IndexedDB Client Database
 * Built with Dexie.js for resilient local retail operation.
 */
export class PosTerminalDatabase extends Dexie {
  constructor() {
    super("PosTerminalDB");

    this.version(1).stores({
      products: "&_id, name, category, barcode, price, stock",
      offline_bills: "&id, billNumber, customerName, customerContact, date, totalAmount, syncStatus, createdAt",
      metadata: "&key, value, updatedAt",
    });

    this.products = this.table("products");
    this.offline_bills = this.table("offline_bills");
    this.metadata = this.table("metadata");
  }

  /**
   * Bulk upserts products from server into local IndexedDB.
   * @param {Array} productsList 
   */
  async bulkUpsertProducts(productsList = []) {
    if (!Array.isArray(productsList) || productsList.length === 0) return;

    const normalized = productsList.map((item) => ({
      _id: String(item._id || item.id || `LOCAL-${Date.now()}-${Math.random()}`),
      name: item.name || "Untitled Item",
      category: item.category || "General",
      salePrice: Number(item.salePrice !== undefined ? item.salePrice : item.price || 0),
      price: Number(item.salePrice !== undefined ? item.salePrice : item.price || 0),
      purchasePrice: Number(item.purchasePrice || 0),
      stock: Number(item.stock || 0),
      barcode: item.barcode ? String(item.barcode).trim() : "",
      sku: item.sku ? String(item.sku).trim().toUpperCase() : "",
      reorderLevel: Number(item.reorderLevel || 5),
      image: item.image || "",
      dealers: item.dealers || "",
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));

    await this.transaction("rw", this.products, async () => {
      await this.products.bulkPut(normalized);
    });

    await this.metadata.put({
      key: "last_product_sync",
      value: new Date().toISOString(),
      count: normalized.length,
    });
  }

  /**
   * Retrieves all products stored in local IndexedDB.
   * @returns {Promise<Array>}
   */
  async getAllLocalProducts() {
    return await this.products.toArray();
  }

  /**
   * Decrements stock locally in IndexedDB when checkout is finalized.
   * @param {Array} cartItems 
   */
  async decrementLocalStock(cartItems = []) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;

    await this.transaction("rw", this.products, async () => {
      for (const item of cartItems) {
        const itemId = String(item._id || item.itemId || item.id);
        const product = await this.products.get(itemId);
        if (product) {
          const qty = Number(item.quantity || 1);
          const nextStock = Math.max(0, (Number(product.stock) || 0) - qty);
          await this.products.update(itemId, { stock: nextStock });
        }
      }
    });
  }

  /**
   * Saves a completed transaction into local IndexedDB offline queue.
   * Instantly decrements product stock in local store.
   * @param {Object} billPayload 
   * @returns {Promise<Object>} The stored offline bill
   */
  async saveOfflineBill(billPayload = {}) {
    const timestamp = Date.now();
    const offlineId = `OFFLINE-${timestamp}-${Math.floor(Math.random() * 10000)}`;

    const offlineRecord = {
      ...billPayload,
      id: offlineId,
      _id: offlineId,
      isOffline: true,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      date: billPayload.date || new Date().toISOString(),
      retryCount: 0,
    };

    await this.transaction("rw", this.offline_bills, async () => {
      await this.offline_bills.put(offlineRecord);
    });

    // Instantly reflect stock depletion on terminal UI
    await this.decrementLocalStock(billPayload.cartItems);

    // Notify listeners across window
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pos:offline-queue-updated", { detail: { id: offlineId } }));
    }

    return offlineRecord;
  }

  /**
   * Gets all pending offline bills waiting for remote synchronization.
   * @returns {Promise<Array>}
   */
  async getPendingBills() {
    return await this.offline_bills.where("syncStatus").equals("pending").toArray();
  }

  /**
   * Counts pending offline bills.
   * @returns {Promise<number>}
   */
  async getPendingSyncCount() {
    return await this.offline_bills.where("syncStatus").equals("pending").count();
  }

  /**
   * Marks an offline bill as successfully synced with MongoDB.
   * @param {string} offlineId 
   * @param {Object} serverResponse 
   */
  async markBillSynced(offlineId, serverResponse = {}) {
    await this.offline_bills.update(offlineId, {
      syncStatus: "synced",
      remoteId: serverResponse._id || serverResponse.id || null,
      syncedAt: new Date().toISOString(),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pos:offline-queue-updated", { detail: { id: offlineId, synced: true } }));
    }
  }

  /**
   * Returns all local offline bills (both pending and synced).
   * @returns {Promise<Array>}
   */
  async getAllLocalBills() {
    return await this.offline_bills.reverse().sortBy("createdAt");
  }
}

export const posDb = new PosTerminalDatabase();
export default posDb;
