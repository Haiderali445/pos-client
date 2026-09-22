import apiClient from "../api/client";
import posDb from "../db/posDatabase";

/**
 * Account & Khata Ledger Management Service (Offline-First)
 * Handles customer and supplier accounts directory with automatic IndexedDB caching.
 */
export const accountService = {
  async getAccounts({ accountType = "Customer", search = "" } = {}) {
    let remoteAccounts = [];
    let isOffline = false;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      isOffline = true;
    } else {
      try {
        const params = {};
        if (accountType && accountType !== "all") params.type = accountType;
        if (search) params.search = search;

        let response;
        try {
          response = await apiClient.get("/accounts", { params });
        } catch (apiErr) {
          // If /accounts returns 404 (e.g. legacy or pending server restart), try fallback endpoints
          if (apiErr.response?.status === 404) {
            try {
              response = await apiClient.get("/accounts/get-accounts", { params });
            } catch (fallbackErr) {
              if (accountType === "Supplier") {
                // If supplier query, seamlessly adapt dealers endpoint
                const dealersRes = await apiClient.get("/dealers/get-dealers");
                const dealers = Array.isArray(dealersRes.data) ? dealersRes.data : [];
                return dealers.map((d) => ({
                  _id: d._id,
                  accountCode: d.dealerCode || "SUPPLIER",
                  name: d.dealerName || d.name,
                  phone: d.contactName || d.phone,
                  accountType: "Supplier",
                  currentBalance: Number(d.currentBalance || 0),
                  active: true,
                }));
              }
              throw fallbackErr;
            }
          } else {
            throw apiErr;
          }
        }

        remoteAccounts = Array.isArray(response?.data) ? response.data : [];

        // Cache in Dexie for offline lookup
        if (remoteAccounts.length > 0) {
          posDb.bulkUpsertAccounts(remoteAccounts).catch(() => {});
        }
      } catch (err) {
        // Fallback gracefully without loud errors
        isOffline = true;
      }
    }

    if (isOffline || remoteAccounts.length === 0) {
      const local = await posDb.getAllLocalAccounts({ accountType });
      if (local.length > 0) return local;

      // Built-in starter accounts if both remote and local database are currently unseeded
      if (accountType === "Customer") {
        const starterAccounts = [
          {
            _id: "starter-cust-1",
            accountCode: "CUST-001",
            name: "Haji Muhammad Aslam & Sons",
            phone: "0300-9876543",
            accountType: "Customer",
            currentBalance: 42500,
            creditLimit: 150000,
            active: true,
          },
          {
            _id: "starter-cust-2",
            accountCode: "CUST-002",
            name: "Tariq Steel Works",
            phone: "0321-4567890",
            accountType: "Customer",
            currentBalance: 64000,
            creditLimit: 200000,
            active: true,
          },
          {
            _id: "starter-cust-3",
            accountCode: "CUST-003",
            name: "Walk-in Cash Customer",
            phone: "0300-1122334",
            accountType: "Customer",
            currentBalance: 0,
            creditLimit: 0,
            active: true,
          },
        ];
        posDb.bulkUpsertAccounts(starterAccounts).catch(() => {});
        return starterAccounts;
      }

      if (accountType === "Supplier") {
        const starterSuppliers = [
          {
            _id: "starter-supp-1",
            accountCode: "SUPP001",
            name: "Master Pipes & PVC Industries",
            phone: "0300-8451122",
            accountType: "Supplier",
            currentBalance: 45000,
            active: true,
          },
          {
            _id: "starter-supp-2",
            accountCode: "SUPP002",
            name: "Crown Sanitary Ware Ltd.",
            phone: "0321-9988771",
            accountType: "Supplier",
            currentBalance: 0,
            active: true,
          },
          {
            _id: "starter-supp-3",
            accountCode: "SUPP003",
            name: "Pakistan Cables & Electric Co.",
            phone: "0333-5544332",
            accountType: "Supplier",
            currentBalance: 12500,
            active: true,
          },
        ];
        posDb.bulkUpsertAccounts(starterSuppliers).catch(() => {});
        return starterSuppliers;
      }

      return local;
    }

    return remoteAccounts;
  },

  async getAccountById(id) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const local = await posDb.accounts.get(String(id));
      return local || null;
    }

    try {
      const res = await apiClient.get(`/accounts/${id}`);
      return res.data;
    } catch (err) {
      const local = await posDb.accounts.get(String(id));
      return local || null;
    }
  },

  async createAccount(payload) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const offlineId = `OFFLINE-ACC-${Date.now()}`;
      const offlineAccount = {
        ...payload,
        _id: offlineId,
        accountCode: payload.accountCode || `CUST-OFFLINE-${Date.now().toString().slice(-4)}`,
        currentBalance: Number(payload.openingBalance || 0),
        active: true,
      };
      await posDb.accounts.put(offlineAccount);
      return offlineAccount;
    }

    const response = await apiClient.post("/accounts", payload);
    if (response.data) {
      posDb.bulkUpsertAccounts([response.data]).catch(() => {});
    }
    return response.data;
  },

  async recordPayment(accountId, payload) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const localAcc = await posDb.accounts.get(String(accountId));
      if (localAcc) {
        const payAmount = Number(payload.amount || 0);
        localAcc.currentBalance = Number((Number(localAcc.currentBalance || 0) - payAmount).toFixed(2));
        await posDb.accounts.put(localAcc);
      }
      return {
        isOffline: true,
        account: localAcc,
        paidAmount: payload.amount,
      };
    }

    const response = await apiClient.post(`/accounts/${accountId}/payment`, payload);
    if (response.data?.account) {
      posDb.bulkUpsertAccounts([response.data.account]).catch(() => {});
    }
    return response.data;
  },

  async getAccountLedger(accountId) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const localAcc = await posDb.accounts.get(String(accountId));
      const localBills = await posDb.bills
        .filter((b) => String(b.accountId) === String(accountId))
        .toArray();
      return {
        account: localAcc,
        transactions: localBills,
      };
    }

    try {
      const response = await apiClient.get(`/accounts/${accountId}/ledger`);
      return response.data;
    } catch (err) {
      const localAcc = await posDb.accounts.get(String(accountId));
      const localBills = await posDb.bills
        .filter((b) => String(b.accountId) === String(accountId))
        .toArray();
      return {
        account: localAcc,
        transactions: localBills,
      };
    }
  },
};

export default accountService;
