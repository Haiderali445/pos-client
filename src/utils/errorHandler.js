import { message } from "antd";

/**
 * Centralized Error & Notification Handler
 * Provides consistent error extraction, logging, and Ant Design feedback across the system.
 */

/**
 * Extracts a human-readable error message from Axios errors, server responses, or Error objects.
 * @param {any} error
 * @param {string} [fallbackMessage="An unexpected error occurred."]
 * @returns {string}
 */
export function getErrorMessage(error, fallbackMessage = "An unexpected error occurred.") {
  if (!error) return fallbackMessage;

  if (typeof error === "string") return error;

  // Axios response payload error
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === "string") return data;
    if (data.error && typeof data.error === "string") return data.error;
    if (data.message && typeof data.message === "string") return data.message;
  }

  // Standard JS error
  if (error.message && typeof error.message === "string") {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Dispatches an Ant Design error message popup.
 * @param {any} error
 * @param {string} [fallbackMessage]
 */
export function notifyError(error, fallbackMessage) {
  const msg = getErrorMessage(error, fallbackMessage);
  message.error(msg);
}

/**
 * Dispatches an Ant Design success message popup.
 * @param {string} msg
 */
export function notifySuccess(msg) {
  message.success(msg);
}

/**
 * Dispatches an Ant Design warning message popup.
 * @param {string} msg
 */
export function notifyWarning(msg) {
  message.warning(msg);
}

/**
 * Dispatches an Ant Design info message popup.
 * @param {string} msg
 */
export function notifyInfo(msg) {
  message.info(msg);
}
