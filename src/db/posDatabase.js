import Dexie from "dexie";

/**
 * PosTerminalDB - Enterprise Offline-First IndexedDB Client Database
 * Built with Dexie.js for resilient local retail operation with FIFO stock batches,
 * customer Khata ledger directories, and offline credit queues.
 */
export class PosTerminalDatabase extends Dexie {
  constructor() {
    super("PosTerminalDB");

    // Version 1: Legacy Baseline Schema
    this.version(1).stores({
      products: "&_id, name, category, barcode, price, stock",
      offline_bills: "&id, billNumber, customerName, customerContact, date, totalAmount, syncStatus, createdAt",
      metadata: "&key, value, updatedAt",
    });

    // Version 2: Enterprise ERP Schema with Accounts, Product Batches, and Freight/Discount Queues
    this.version(2).stores({
      products: "&_id, name, category, barcode, price, salePrice, purchasePrice, stock, sku, active",
      accounts: "&_id, accountCode, name, phone, accountType, currentBalance, active",
      offline_bills: "&id, billNumber, invoiceNumber, accountId, costumerName, costumerNumber, date, totalAmount, fare, totalDiscount, paymentMethod, syncStatus, createdAt",
      metadata: "&key, value, updatedAt",
    });

    this.products = this.table("products");
    this.accounts = this.table("accounts");
    this.offline_bills = this.table("offline_bills");
    this.metadata = this.table("metadata");
  }

  // =========================================================================
  // Product Catalog & FIFO Batch Management
  // =========================================================================

  /**
   * Bulk upserts products and their FIFO stock batches from server into local IndexedDB.
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
      active: item.active !== false,
      batches: (Array.isArray(item.stockBatches) ? item.stockBatches : Array.isArray(item.batches) ? item.batches : []).map((b) => ({
        _id: String(b._id || b.id || Math.random()),
        batchCode: String(b.batchCode || ""),
        qty: Number(b.qty || 0),
        availableQty: Number(b.availableQty !== undefined ? b.availableQty : b.qty || 0),
        unitCost: Number(b.unitCost || 0),
        receivedDate: b.receivedDate || b.createdAt || new Date().toISOString(),
        createdAt: b.createdAt || new Date().toISOString(),
      })),
      stockBatches: (Array.isArray(item.stockBatches) ? item.stockBatches : Array.isArray(item.batches) ? item.batches : []).map((b) => ({
        _id: String(b._id || b.id || Math.random()),
        batchCode: String(b.batchCode || ""),
        qty: Number(b.qty || 0),
        availableQty: Number(b.availableQty !== undefined ? b.availableQty : b.qty || 0),
        unitCost: Number(b.unitCost || 0),
        receivedDate: b.receivedDate || b.createdAt || new Date().toISOString(),
        createdAt: b.createdAt || new Date().toISOString(),
      })),
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
   * Decrements stock locally in IndexedDB when checkout is finalized,
   * performing local FIFO batch deductions across available batches.
   * @param {Array} cartItems
   */
  async decrementLocalStock(cartItems = []) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;

    await this.transaction("rw", this.products, async () => {
      for (const item of cartItems) {
        const itemId = String(item._id || item.itemId || item.id);
        const product = await this.products.get(itemId);
        if (product) {
          const qtyRequested = Number(item.quantity || 1);
          let remainingToDeduct = qtyRequested;

          // Deduct from local batches in FIFO order if batches exist
          if (Array.isArray(product.batches) && product.batches.length > 0) {
            const sortedBatches = [...product.batches].sort(
              (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
            );

            for (const b of sortedBatches) {
              if (remainingToDeduct <= 0) break;
              if (b.availableQty > 0) {
                const take = Math.min(remainingToDeduct, b.availableQty);
                b.availableQty = Number((b.availableQty - take).toFixed(3));
                remainingToDeduct = Number((remainingToDeduct - take).toFixed(3));
              }
            }
            product.batches = sortedBatches;
          }

          product.stock = Math.max(0, Number(((Number(product.stock) || 0) - qtyRequested).toFixed(3)));
          await this.products.update(itemId, {
            stock: product.stock,
            batches: product.batches || [],
          });
        }
      }
    });
  }

  // =========================================================================
  // Customer & Supplier Accounts (Khata Ledger Directory)
  // =========================================================================

  /**
   * Bulk upserts accounts from server into local IndexedDB.
   * @param {Array} accountsList
   */
  async bulkUpsertAccounts(accountsList = []) {
    if (!Array.isArray(accountsList) || accountsList.length === 0) return;

    const normalized = accountsList.map((acc) => ({
      _id: String(acc._id || acc.id || `ACC-${Date.now()}-${Math.random()}`),
      accountCode: String(acc.accountCode || "").toUpperCase(),
      name: acc.name || "Unnamed Account",
      phone: acc.phone ? String(acc.phone).trim() : "",
      email: acc.email || "",
      address: acc.address || "",
      accountType: acc.accountType || "Customer",
      currentBalance: Number(acc.currentBalance || 0),
      creditLimit: Number(acc.creditLimit || 0),
      active: acc.active !== false,
      updatedAt: acc.updatedAt || new Date().toISOString(),
    }));

    await this.transaction("rw", this.accounts, async () => {
      await this.accounts.bulkPut(normalized);
    });

    await this.metadata.put({
      key: "last_accounts_sync",
      value: new Date().toISOString(),
      count: normalized.length,
    });
  }

  /**
   * Retrieves all accounts stored in local IndexedDB matching filter.
   * @param {Object} [filter]
   * @param {string} [filter.accountType="Customer"]
   * @returns {Promise<Array>}
   */
  async getAllLocalAccounts({ accountType = "Customer" } = {}) {
    if (accountType && accountType !== "all") {
      return await this.accounts.where("accountType").equals(accountType).toArray();
    }
    return await this.accounts.toArray();
  }

  /**
   * Updates local customer / supplier Khata balance immediately during offline sales.
   * @param {string} accountId
   * @param {number} delta - Positive adds debt (receivable), negative reduces debt
   */
  async updateLocalAccountBalance(accountId, delta) {
    if (!accountId || !delta) return;

    await this.transaction("rw", this.accounts, async () => {
      const account = await this.accounts.get(String(accountId));
      if (account) {
        const nextBalance = Number(((Number(account.currentBalance) || 0) + Number(delta)).toFixed(2));
        await this.accounts.update(String(accountId), { currentBalance: nextBalance });
      }
    });
  }

  // =========================================================================
  // Offline Bills Queue & Synchronization Management
  // =========================================================================

  /**
   * Saves a completed transaction into local IndexedDB offline queue.
   * Instantly decrements product stock and updates customer Khata balance locally.
   * @param {Object} billPayload
   * @returns {Promise<Object>} The stored offline bill
   */
  async saveOfflineBill(billPayload = {}) {
    const timestamp = Date.now();
    const offlineId = `OFFLINE-${timestamp}-${Math.floor(Math.random() * 10000)}`;

    const totalAmount = Number(billPayload.totalAmount || 0);
    const paidAmount = Number(billPayload.paidAmount || 0);
    const fare = Number(billPayload.fare || 0);
    const totalDiscount = Number(billPayload.totalDiscount || 0);
    const openDebt = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));

    const offlineRecord = {
      ...billPayload,
      id: offlineId,
      _id: offlineId,
      invoiceNumber: billPayload.invoiceNumber || `OFFLINE-INV-${timestamp.toString().slice(-6)}`,
      totalAmount,
      paidAmount,
      fare,
      totalDiscount,
      dueAmount: openDebt,
      isOffline: true,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      date: billPayload.date || new Date().toISOString(),
      retryCount: 0,
    };

    await this.transaction("rw", this.offline_bills, async () => {
      await this.offline_bills.put(offlineRecord);
    });

    // 1. Instantly reflect stock depletion on terminal UI
    await this.decrementLocalStock(billPayload.cartItems);

    // 2. Instantly update Customer Khata debt locally if sale is on borrow or partial cash
    const isCredit =
      billPayload.paymentMethod === "borrow" ||
      billPayload.paymentMethod === "credit" ||
      paidAmount < totalAmount;

    if (isCredit && billPayload.accountId && openDebt > 0) {
      await this.updateLocalAccountBalance(billPayload.accountId, openDebt);
    }

    // Notify listeners across window
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("pos:offline-queue-updated", { detail: { id: offlineId, debt: openDebt } })
      );
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
      window.dispatchEvent(
        new CustomEvent("pos:offline-queue-updated", { detail: { id: offlineId, synced: true } })
      );
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
