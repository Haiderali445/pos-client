/**
 * Product & Stock Inventory Pure Calculations
 * Formulas for unit counts, inventory valuation, and filter criteria.
 */

export function calculateItemStats(itemsData = []) {
  const safeItems = Array.isArray(itemsData) ? itemsData : [];
  const totalCount = safeItems.length;
  const totalStockUnits = safeItems.reduce((acc, i) => acc + (Number(i?.stock) || 0), 0);
  const lowStockCount = safeItems.filter(
    (i) => Number(i?.stock) > 0 && Number(i?.stock) <= (Number(i?.reorderLevel) || 5)
  ).length;
  const outOfStockCount = safeItems.filter((i) => Number(i?.stock) <= 0).length;
  const inventoryValuation = safeItems.reduce(
    (acc, i) => acc + (Number(i?.purchasePrice) || 0) * (Number(i?.stock) || 0),
    0
  );

  return { totalCount, totalStockUnits, lowStockCount, outOfStockCount, inventoryValuation };
}

export function extractItemCategories(itemsData = []) {
  const safeItems = Array.isArray(itemsData) ? itemsData : [];
  return ["all", ...new Set(safeItems.map((i) => i?.category).filter(Boolean))];
}

export function filterItems(itemsData = [], search = "", categoryFilter = "all") {
  const safeItems = Array.isArray(itemsData) ? itemsData : [];
  const query = (search || "").trim().toLowerCase();

  return safeItems.filter((item) => {
    const matchSearch =
      !query ||
      (item?.name && item.name.toLowerCase().includes(query)) ||
      (item?.category && item.category.toLowerCase().includes(query)) ||
      (item?.barcode && String(item.barcode).toLowerCase().includes(query)) ||
      (item?.sku && String(item.sku).toLowerCase().includes(query));

    const matchCat = categoryFilter === "all" || item?.category === categoryFilter;
    return matchSearch && matchCat;
  });
}

export function formatCurrency(val) {
  return `PKR ${Number(val || 0).toFixed(2)}`;
}

export function getItemStockBadge(stock, reorderLevel = 5) {
  const numStock = Number(stock) || 0;
  const threshold = Number(reorderLevel) || 5;

  if (numStock <= 0) {
    return { color: "default", label: "Out of Stock" };
  }
  if (numStock <= threshold) {
    return { color: "warning", label: `${numStock} Units` };
  }
  return { color: "success", label: `${numStock} Units` };
}

export function computeItemValuation(purchasePrice, stock) {
  return (Number(purchasePrice) || 0) * (Number(stock) || 0);
}
