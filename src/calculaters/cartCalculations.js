/**
 * POS Cart & Order Totals Pure Calculations
 * Mathematical formulas for shopping cart, items count, and tender change.
 */

export function calculateCartTotal(cartItems = []) {
  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  return safeItems.reduce((total, item) => {
    return total + (Number(item?.salePrice) || 0) * (Number(item?.quantity) || 0);
  }, 0);
}

export function calculateCartUnits(cartItems = []) {
  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  return safeItems.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0);
}

export function calculateLineTotal(salePrice, quantity) {
  return (Number(salePrice) || 0) * (Number(quantity) || 0);
}

export function calculateChangeDue(paidAmount, total) {
  return Math.max(0, (Number(paidAmount) || 0) - (Number(total) || 0));
}

export function formatCurrency(val) {
  return `PKR ${Number(val || 0).toFixed(2)}`;
}
