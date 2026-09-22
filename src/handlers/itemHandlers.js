import { notifyError, notifySuccess } from "../utils/errorHandler";
export * from "../calculaters/itemCalculations";

/**
 * Product & Stock Operations Handlers
 * Orchestrates product addition, editing, and deletion with centralized error interception.
 */

/**
 * 
 * 
 * Handles add or edit product submission with centralized error interception.
 * @param {Object} params
 * @param {Object} params.addProduct
 * @param {Object} params.editProduct
 * @param {Object|null} params.editItem
 * @param {Object} params.values
 * @param {Function} [params.onSuccess]
 */

/**
 * Item Stock Badge Calculator
 * Returns normalized status badge labels and status identifiers.
 */
export function getItemStockBadge(stock, reorderLevel = 5) {
  if (stock < 1) {
    return { label: "Out of Stock", status: "out" };
  }
  if (stock <= reorderLevel) {
    return { label: "Low Stock", status: "low" };
  }
  return { label: "In Stock", status: "ok" };
}
export async function handleProductSubmit({
  addProduct,
  editProduct,
  editItem,
  values,
  onSuccess,
}) {
  try {
    if (!editItem) {
      await addProduct.mutateAsync(values);
      notifySuccess("Product successfully added to inventory!");
    } else {
      await editProduct.mutateAsync({
        ...values,
        itemId: editItem._id,
      });
      notifySuccess("Product updated successfully!");
    }
    if (typeof onSuccess === "function") {
      onSuccess();
    }
  } catch (error) {
    notifyError(error, "Failed to save product details");
  }
}

/**
 * Handles product deletion with centralized error interception.
 * @param {Object} params
 * @param {Object} params.deleteProduct
 * @param {string} params.itemId
 * @param {Function} [params.onSuccess]
 */
export async function handleProductDelete({ deleteProduct, itemId, onSuccess }) {
  try {
    await deleteProduct.mutateAsync(itemId);
    notifySuccess("Product deleted from catalog");
    if (typeof onSuccess === "function") {
      onSuccess();
    }
  } catch (error) {
    notifyError(error, "Failed to delete product");
  }
}
