/**
 * Stock & Inventory Valuation Pure Calculations
 * Financial KPI formulas, aggregation, and formatting.
 */

export function calculateFinancialMetrics(products = [], bills = [], charges = []) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeBills = Array.isArray(bills) ? bills : [];
  const safeCharges = Array.isArray(charges) ? charges : [];

  const currentInventoryValuation = safeProducts.reduce(
    (sum, item) => sum + (Number(item?.purchasePrice) || 0) * (Number(item?.stock) || 0),
    0
  );

  const potentialRetailValuation = safeProducts.reduce(
    (sum, item) => sum + (Number(item?.salePrice) || 0) * (Number(item?.stock) || 0),
    0
  );

  const totalSalesRevenue = safeBills.reduce(
    (sum, bill) => sum + (Number(bill?.totalAmount) || 0),
    0
  );

  let totalCogs = 0;
  safeBills.forEach((bill) => {
    if (Array.isArray(bill?.cartItems)) {
      bill.cartItems.forEach((item) => {
        totalCogs += (Number(item?.purchasePrice) || 0) * (Number(item?.quantity) || 0);
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
    (p) => Number(p?.stock) > 0 && Number(p?.stock) <= (Number(p?.reorderLevel) || 5)
  );
  const outOfStockItems = safeProducts.filter((p) => Number(p?.stock) <= 0);

  return {
    currentInventoryValuation,
    potentialRetailValuation,
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
  const numStock = Number(stock) || 0;
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
  return (Number(purchasePrice) || 0) * (Number(stock) || 0);
}
