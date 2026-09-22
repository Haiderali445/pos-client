/**
 * Stock & Inventory Valuation Pure Calculations
 * Financial KPI formulas, aggregation, and formatting.
 */

export function calculateFinancialMetrics(products = [], bills = [], charges = []) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeBills = Array.isArray(bills) ? bills : [];
  const safeCharges = Array.isArray(charges) ? charges : [];

  const getStockUnits = (item) => Math.max(0, Number(item?.stock) || 0);

  const currentInventoryValuation = safeProducts.reduce(
    (sum, item) => sum + (Number(item?.purchasePrice) || 0) * getStockUnits(item),
    0
  );

  const potentialRetailValuation = safeProducts.reduce(
    (sum, item) => sum + (Number(item?.salePrice) || 0) * getStockUnits(item),
    0
  );

  const totalStockUnits = safeProducts.reduce((sum, item) => sum + getStockUnits(item), 0);

  const totalSalesRevenue = safeBills.reduce(
    (sum, bill) => sum + (Number(bill?.totalAmount) || 0),
    0
  );

  let totalCogs = 0;
  safeBills.forEach((bill) => {
    if (Array.isArray(bill?.cartItems)) {
      bill.cartItems.forEach((item) => {
        const itemQty = Number(item?.quantity) || 0;
        if (Array.isArray(item?.batchAllocations) && item.batchAllocations.length > 0) {
          totalCogs += item.batchAllocations.reduce(
            (acc, a) => acc + (Number(a.unitCost || 0) * Number(a.quantity || 0)),
            0
          );
        } else {
          const cost = Number(item?.unitCost !== undefined ? item.unitCost : item?.purchasePrice || 0);
          totalCogs += cost * itemQty;
        }
      });
    }
  });

  const grossProfit = totalSalesRevenue - totalCogs;

  const totalExpenses = safeCharges.reduce(
    (sum, charge) => sum + (Number(charge?.amount) || 0),
    0
  );

  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

  const lowStockItems = safeProducts.filter(
    (p) => getStockUnits(p) > 0 && getStockUnits(p) <= (Number(p?.reorderLevel) || 5)
  );
  const outOfStockItems = safeProducts.filter((p) => getStockUnits(p) <= 0);

  return {
    currentInventoryValuation,
    potentialRetailValuation,
    totalStockUnits,
    totalSalesRevenue,
    totalCogs,
    grossProfit,
    totalExpenses,
    netProfit,
    profitMargin,
    lowStockItems,
    outOfStockItems,
  };
}

export function getFinancialPieData(metrics = {}) {
  return [
    { name: "Live Stock Valuation", value: Math.max(0, metrics.currentInventoryValuation || 0) },
    { name: "Total Gross Sales", value: Math.max(0, metrics.totalSalesRevenue || 0) },
    { name: "Gross Profit", value: Math.max(0, metrics.grossProfit || 0) },
    { name: "Total Expenses", value: Math.max(0, metrics.totalExpenses || 0) },
  ];
}

export function getCategoryChartData(products = []) {
  const safeProducts = Array.isArray(products) ? products : [];
  const map = {};

  safeProducts.forEach((p) => {
    const cat = p?.category?.trim() || "Others";
    if (!map[cat]) {
      map[cat] = { category: cat, totalStock: 0, valuation: 0 };
    }
    const stock = Number(p?.stock) || 0;
    const cost = Number(p?.purchasePrice) || 0;
    map[cat].totalStock += stock;
    map[cat].valuation += cost * stock;
  });

  return Object.values(map);
}

export function formatCurrency(val) {
  return `PKR ${Number(val || 0).toFixed(2)}`;
}

export function getStockStatus(stock, reorderLevel = 5) {
  const numStock = Math.max(0, Number(stock) || 0);
  const threshold = Number(reorderLevel) || 5;
  const isOutOfStock = numStock <= 0;
  const isLowStock = !isOutOfStock && numStock <= threshold;

  if (isOutOfStock) {
    return { color: "red", label: "Depleted (0)", isOutOfStock: true, isLowStock: false };
  }
  if (isLowStock) {
    return { color: "warning", label: `${numStock} Units`, isOutOfStock: false, isLowStock: true };
  }
  return { color: "success", label: `${numStock} Units`, isOutOfStock: false, isLowStock: false };
}

export function computeItemAssetValue(purchasePrice, stock) {
  return (Number(purchasePrice) || 0) * Math.max(0, Number(stock) || 0);
}

/**
 * Pure simulation of FIFO batch consumption across batches.
 * Does not mutate original batches array or batch objects.
 * @param {Array} batches - Array of batch objects { _id, batchCode, availableQty, unitCost, createdAt }
 * @param {number} requestedQty - Quantity needed
 * @param {number} fallbackCost - Cost to use if batches are exhausted
 * @returns {{ allocations: Array, totalCost: number, unitCost: number, remainingBatches: Array }}
 */
export function computeFIFOAllocations(batches = [], requestedQty = 0, fallbackCost = 0) {
  const safeBatches = Array.isArray(batches)
    ? batches.map((b) => ({
        ...b,
        availableQty: Number(b.availableQty !== undefined ? b.availableQty : b.qty || 0),
      }))
    : [];

  const sorted = safeBatches.sort(
    (a, b) => new Date(a.createdAt || a.receivedDate || 0) - new Date(b.createdAt || b.receivedDate || 0)
  );

  let remaining = Number(requestedQty) || 0;
  let totalCost = 0;
  const allocations = [];

  for (const batch of sorted) {
    if (remaining <= 0) break;
    if (batch.availableQty > 0) {
      const take = Math.min(remaining, batch.availableQty);
      batch.availableQty = Number((batch.availableQty - take).toFixed(3));
      remaining = Number((remaining - take).toFixed(3));
      const cost = Number((take * Number(batch.unitCost || 0)).toFixed(2));
      totalCost += cost;

      allocations.push({
        batchId: batch._id,
        batchCode: batch.batchCode,
        quantity: take,
        unitCost: Number(batch.unitCost || 0),
        totalCost: cost,
      });
    }
  }

  if (remaining > 0) {
    const fallback = Number(fallbackCost || 0);
    const cost = Number((remaining * fallback).toFixed(2));
    totalCost += cost;
    allocations.push({
      batchId: null,
      batchCode: "LEGACY-STOCK",
      quantity: remaining,
      unitCost: fallback,
      totalCost: cost,
    });
  }

  const effectiveUnitCost = requestedQty > 0 ? Number((totalCost / requestedQty).toFixed(2)) : 0;

  return {
    allocations,
    totalCost: Number(totalCost.toFixed(2)),
    unitCost: effectiveUnitCost,
    remainingBatches: sorted,
  };
}
