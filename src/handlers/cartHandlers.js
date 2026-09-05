import confetti from "canvas-confetti";
import { notifyError, notifySuccess } from "../utils/errorHandler";
export * from "../calculaters/cartCalculations";

/**
 * POS Cart & Checkout Operations Handlers
 * Orchestrates transaction completion, confetti, and centralized error interception.
 */

/**
 * Prepares the payload for completing checkout / creating an invoice.
 * @param {Object} values - Form values
 * @param {Array} cartItems - Current cart line items
 * @param {number} total - Calculated total
 * @returns {Object} Bill payload
 */
export function prepareCartCheckoutPayload(values = {}, cartItems = [], total = 0) {
  return {
    ...values,
    date: new Date().toISOString(),
    cartItems,
    paidAmount: Number(values?.paidAmount ?? total),
    totalAmount: total,
  };
}

/**
 * Triggers victory celebration confetti.
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
 * @param {number} params.total
 * @param {Function} [params.onSuccess]
 */
export async function handleCheckoutSubmission({
  checkoutMutation,
  values,
  cartItems,
  total,
  onSuccess,
}) {
  try {
    const payload = prepareCartCheckoutPayload(values, cartItems, total);
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
