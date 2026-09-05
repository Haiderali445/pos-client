import { notifyError, notifySuccess } from "../utils/errorHandler";
export * from "../calculaters/billCalculations";

/**
 * Bill & Invoice CRUD & Event Handlers
 * Orchestrates business operations and dispatches centralized feedback.
 */

/**
 * Prepares the payload for updating an invoice record.
 * @param {Object} selectedBill
 * @param {Object} formValues
 * @returns {Object}
 */
export function prepareEditBillPayload(selectedBill, formValues) {
  const paidAmount = parseFloat(formValues?.paidAmount) || 0;
  const totalAmount = parseFloat(formValues?.totalAmount) || 0;

  return {
    ...selectedBill,
    costumerName: formValues?.costumerName,
    costumerNumber: formValues?.costumerNumber,
    paymentMethod: formValues?.paymentMethod,
    paidAmount,
    totalAmount,
    cartItems: selectedBill?.cartItems || [],
    billId: selectedBill?._id,
  };
}

/**
 * Executes invoice update mutation with centralized error interception.
 * @param {Object} params
 * @param {Object} params.editBillMutation
 * @param {Object} params.selectedBill
 * @param {Object} params.values
 * @param {Function} [params.onSuccess]
 */
export async function handleUpdateBill({ editBillMutation, selectedBill, values, onSuccess }) {
  try {
    const payload = prepareEditBillPayload(selectedBill, values);
    await editBillMutation.mutateAsync(payload);
    notifySuccess("Invoice updated successfully!");
    if (typeof onSuccess === "function") {
      onSuccess();
    }
  } catch (error) {
    notifyError(error, "Failed to update invoice.");
  }
}

/**
 * Executes invoice deletion mutation with centralized error interception.
 * @param {Object} params
 * @param {Object} params.deleteBillMutation
 * @param {string} params.billId
 * @param {Function} [params.onSuccess]
 */
export async function handleDeleteBill({ deleteBillMutation, billId, onSuccess }) {
  try {
    await deleteBillMutation.mutateAsync(billId);
    notifySuccess("Invoice record deleted.");
    if (typeof onSuccess === "function") {
      onSuccess();
    }
  } catch (error) {
    notifyError(error, "Failed to delete invoice.");
  }
}
