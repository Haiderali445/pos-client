import confetti from "canvas-confetti";
import { notifyError, notifySuccess } from "../utils/errorHandler";
export * from "../calculaters/cartCalculations";

/**
 * POS Cart & Checkout Operations Handlers
 * Orchestrates transaction completion, confetti, customer Khata ledger updates, and centralized error interception.
 */

/**
 * Prepares the payload for completing checkout / creating an invoice.
 * Bundles Customer Khata accountId, delivery fare, overall bill discount, and line items.
 * @param {Object} values - Form values (accountId, fare, totalDiscount, paidAmount, paymentMethod, etc.)
 * @param {Array} cartItems - Current cart line items
 * @param {Object|number} calculated - Calculation summary object or raw total
 * @returns {Object} Complete invoice/bill payload
 */
export function prepareCartCheckoutPayload(values = {}, cartItems = [], calculated = {}) {
  const totalAmount =
    typeof calculated === "number"
      ? calculated
      : Number(calculated?.total ?? calculated?.finalTotal ?? values?.totalAmount ?? 0);
  const subtotal = Number(calculated?.subtotal ?? values?.subtotal ?? totalAmount);
  const fare = Number(values?.fare ?? calculated?.fare ?? 0);
  const totalDiscount = Number(values?.totalDiscount ?? calculated?.totalDiscount ?? 0);
  const paidAmount = Number(values?.paidAmount !== undefined ? values.paidAmount : totalAmount);

  return {
    ...values,
    invoiceType: "Sale",
    accountId: values.accountId || null,
    costumerName: values.costumerName ? String(values.costumerName).trim() : "",
    costumerNumber: values.costumerNumber ? String(values.costumerNumber).trim() : "",
    fare,
    totalDiscount,
    subtotal,
    totalAmount,
    paidAmount,
    dueAmount: Math.max(0, Number((totalAmount - paidAmount).toFixed(2))),
    paymentMethod: values.paymentMethod || "cash",
    date: new Date().toISOString(),
    cartItems,
  };
}

/**
 * Triggers victory celebration confetti upon checkout.
 */
export function triggerCheckoutConfetti() {
  confetti({
    particleCount: 90,
    spread: 80,
    origin: { y: 0.6 },
  });
}

/**
 * Executes checkout submission with centralized error interception.
 * @param {Object} params
 * @param {Object} params.checkoutMutation
 * @param {Object} params.values
 * @param {Array} params.cartItems
 * @param {Object|number} params.calculated - Total or calculation metrics
 * @param {Function} [params.onSuccess]
 */
export async function handleCheckoutSubmission({
  checkoutMutation,
  values,
  cartItems,
  calculated,
  total,
  onSuccess,
}) {
  try {
    const calc = calculated || total || 0;
    const payload = prepareCartCheckoutPayload(values, cartItems, calc);
    const result = await checkoutMutation.mutateAsync(payload);

    triggerCheckoutConfetti();
    if (result?.isOffline) {
      notifySuccess("Sale completed offline! Saved locally & queued for synchronization.");
    } else {
      notifySuccess("Sale completed successfully!");
    }

    if (typeof onSuccess === "function") {
      onSuccess(result);
    }
  } catch (error) {
    notifyError(error, "Checkout failed. Inventory was not modified.");
  }
}
