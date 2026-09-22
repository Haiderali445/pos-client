/**
 * POS Cart & Order Totals Pure Calculations
 * Mathematical formulas for shopping cart, items count, transport fare, discount, and tender change.
 * All functions are pure with zero side effects.
 */

/**
 * Calculates line total after deducting optional unit-level discount.
 */
export function calculateLineTotal(salePrice, quantity, unitDiscount = 0) {
  const price = Number(salePrice) || 0;
  const qty = Number(quantity) || 0;
  const discount = Number(unitDiscount) || 0;
  return Number(Math.max(0, price * qty - discount).toFixed(2));
}

/**
 * Calculates raw subtotal across cart items before invoice-level discount and fare.
 */
export function calculateCartSubtotal(cartItems = []) {
  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const subtotal = safeItems.reduce((total, item) => {
    const price = item?.salePrice !== undefined ? item.salePrice : item?.price || 0;
    const qty = item?.quantity || 0;
    const discount = item?.unitDiscount || 0;
    return total + calculateLineTotal(price, qty, discount);
  }, 0);
  return Number(subtotal.toFixed(2));
}

/**
 * Calculates tax based on subtotal, tax rate %, and strategy.
 */
export function calculateTaxAmount(amount, taxRate = 0, taxStrategy = "zero") {
  if (!taxRate || taxStrategy === "zero") return 0;
  const base = Math.max(0, Number(amount) || 0);
  const rate = Math.max(0, Number(taxRate) || 0);
  return Number(((base * rate) / 100).toFixed(2));
}

/**
 * Computes final payable amount taking into account subtotal, overall discount, delivery fare, and taxes.
 * Fully backwards compatible: when called with just cartItems, returns subtotal.
 */
export function calculateCartTotal(cartItems = [], options = {}) {
  const subtotal = calculateCartSubtotal(cartItems);

  if (!options || Object.keys(options).length === 0) {
    return subtotal;
  }

  const discount = Math.max(0, Number(options.totalDiscount || options.discount || 0));
  const fare = Math.max(0, Number(options.fare || 0));
  const taxRate = Number(options.taxRate || 0);
  const taxStrategy = options.taxStrategy || "zero";

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxAmount = calculateTaxAmount(discountedSubtotal, taxRate, taxStrategy);

  return Number((discountedSubtotal + taxAmount + fare).toFixed(2));
}

/**
 * Counts total item units in cart.
 */
export function calculateCartUnits(cartItems = []) {
  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const units = safeItems.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0);
  return Number(units.toFixed(3));
}

/**
 * Calculates item-level profit for a line item.
 */
export function calculateItemProfit(salePrice, unitCost, quantity, unitDiscount = 0) {
  const revenue = calculateLineTotal(salePrice, quantity, unitDiscount);
  const cost = (Number(unitCost) || 0) * (Number(quantity) || 0);
  return Number((revenue - cost).toFixed(2));
}

/**
 * Calculates excess cash change due back to the customer.
 */
export function calculateChangeDue(paidAmount, total) {
  const paid = Number(paidAmount) || 0;
  const tot = Number(total) || 0;
  return Number(Math.max(0, paid - tot).toFixed(2));
}

/**
 * Calculates outstanding balance (debt to be posted to customer Khata).
 */
export function calculateDueDebt(paidAmount, total) {
  const paid = Number(paidAmount) || 0;
  const tot = Number(total) || 0;
  return Number(Math.max(0, tot - paid).toFixed(2));
}

/**
 * Formats numeric values to PKR currency display.
 */
export function formatCurrency(val) {
  const num = Number(val || 0);
  return `PKR ${num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
