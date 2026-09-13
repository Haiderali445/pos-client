import { format, isValid } from "date-fns";

/**
 * Bill & Invoice Pure Calculations
 * Mathematical formulas, filters, and display formatting for billing.
 */

export function calculateBillStats(bills = []) {
  const safeBills = Array.isArray(bills) ? bills : [];
  const count = safeBills.length;
  const totalRevenue = safeBills.reduce((acc, b) => acc + Number(b?.totalAmount || 0), 0);
  const totalCollected = safeBills.reduce((acc, b) => acc + Number(b?.paidAmount || 0), 0);
  const totalReceivable = Math.max(0, totalRevenue - totalCollected);

  return { count, totalRevenue, totalCollected, totalReceivable };
}

export function filterBills(bills = [], searchQuery = "", paymentFilter = "all") {
  const safeBills = Array.isArray(bills) ? [...bills] : [];
  const query = (searchQuery || "").trim().toLowerCase();

  // Sort latest sales on top
  safeBills.sort((a, b) => {
    const timeA = new Date(a?.date || a?.createdAt || 0).getTime();
    const timeB = new Date(b?.date || b?.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return safeBills.filter((bill) => {
    const matchSearch =
      !query ||
      (bill?.costumerNumber && String(bill.costumerNumber).toLowerCase().includes(query)) ||
      (bill?.costumerName && String(bill.costumerName).toLowerCase().includes(query)) ||
      (bill?._id && String(bill._id).toLowerCase().includes(query));

    const matchPayment = paymentFilter === "all" || bill?.paymentMethod === paymentFilter;
    return matchSearch && matchPayment;
  });
}

export function formatBillDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  return isValid(d) ? format(d, "dd/MM/yyyy HH:mm") : "—";
}

export function formatCurrency(val) {
  return `PKR ${Number(val || 0).toFixed(2)}`;
}
