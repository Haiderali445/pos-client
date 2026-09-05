/**
 * POS Terminal Pure Calculations & Search Algorithms
 */

export function filterCatalogProducts(products = [], debouncedSearch = "", category = "all") {
  const safeProducts = Array.isArray(products) ? products : [];
  const query = (debouncedSearch || "").trim().toLowerCase();

  return safeProducts.filter((product) => {
    const haystack = [product?.name, product?.sku, product?.barcode, product?.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesCat = category === "all" || product?.category === category;
    return matchesSearch && matchesCat;
  });
}

export function findProductByCode(products = [], code = "") {
  const safeProducts = Array.isArray(products) ? products : [];
  const cleanCode = (code || "").trim().toLowerCase();
  if (!cleanCode) return null;

  return safeProducts.find((item) =>
    [item?.barcode, item?.sku, item?._id]
      .filter(Boolean)
      .some((val) => String(val).trim().toLowerCase() === cleanCode)
  ) || null;
}

export function extractCatalogCategories(products = []) {
  const safeProducts = Array.isArray(products) ? products : [];
  return ["all", ...new Set(safeProducts.map((p) => p?.category).filter(Boolean))];
}
