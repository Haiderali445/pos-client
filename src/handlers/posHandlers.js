import { notifyError, notifySuccess, notifyWarning } from "../utils/errorHandler";
import { findProductByCode } from "../calculaters/posCalculations";
export * from "../calculaters/posCalculations";

/**
 * POS Active Terminal Event Handlers
 * Encapsulates adding to cart, scanning barcode, and error interception.
 */

export function handleAddItemToCart({ product, cartItems = [], dispatch }) {
  if (!product || Number(product.stock) < 1) {
    notifyWarning("Item is currently out of stock");
    return;
  }
  const existing = cartItems.find((item) => item._id === product._id);
  if (existing && existing.quantity >= product.stock) {
    notifyWarning(`Maximum available stock (${product.stock}) reached for this item`);
    return;
  }
  dispatch({ type: "ADD_TO_CART", payload: product });
}

export function handleBarcodeScan({ code, products = [], cartItems = [], dispatch }) {
  const product = findProductByCode(products, code);
  if (product) {
    handleAddItemToCart({ product, cartItems, dispatch });
    notifySuccess(`Scanned: ${product.name}`);
  } else {
    notifyError(null, `No product found with barcode / SKU: "${code}"`);
  }
}
