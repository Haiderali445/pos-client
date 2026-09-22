import assert from "assert";
import {
  calculateCartSubtotal,
  calculateCartTotal,
  calculateCartUnits,
  calculateLineTotal,
  calculateItemProfit,
  calculateChangeDue,
  calculateDueDebt,
} from "../cartCalculations.js";
import { computeFIFOAllocations } from "../stockCalculations.js";

console.log("=================================================");
console.log("TESTING FRONTEND PURE CALCULATORS & FIFO ENGINE");
console.log("=================================================\n");

// 1. Test Line Total & Cart Subtotal
console.log("[TEST 1] Testing Cart Subtotal & Line Total...");
const sampleCart = [
  { _id: "1", name: "Item A", salePrice: 100, quantity: 2, unitDiscount: 10 }, // 100 * 2 - 10 = 190
  { _id: "2", name: "Item B", salePrice: 50, quantity: 4, unitDiscount: 0 },    // 50 * 4 = 200
];

const line1 = calculateLineTotal(100, 2, 10);
assert.strictEqual(line1, 190, "Line 1 total should be 190");

const subtotal = calculateCartSubtotal(sampleCart);
assert.strictEqual(subtotal, 390, "Cart subtotal should be 190 + 200 = 390");

const units = calculateCartUnits(sampleCart);
assert.strictEqual(units, 6, "Units count should be 2 + 4 = 6");
console.log("  ✓ Subtotal, units, and line totals verified.");

// 2. Test Cart Total with Discount & Delivery Fare
console.log("\n[TEST 2] Testing Dynamic Bill Discount, Delivery Fare, & Total...");
// subtotal = 390, discount = 40, fare = 50 -> net = 390 - 40 + 50 = 400
const finalTotal = calculateCartTotal(sampleCart, {
  totalDiscount: 40,
  fare: 50,
});
assert.strictEqual(finalTotal, 400, "Final total should be 390 - 40 + 50 = 400");
console.log("  ✓ Bill discount and delivery fare additions verified.");

// 3. Test Change Due and Khata Debt
console.log("\n[TEST 3] Testing Tender Change Due & Khata Debt...");
// When customer gives 500 for total 400 -> change = 100, debt = 0
const change = calculateChangeDue(500, 400);
const debt0 = calculateDueDebt(500, 400);
assert.strictEqual(change, 100);
assert.strictEqual(debt0, 0);

// When customer gives 250 for total 400 -> change = 0, debt = 150
const change0 = calculateChangeDue(250, 400);
const debt = calculateDueDebt(250, 400);
assert.strictEqual(change0, 0);
assert.strictEqual(debt, 150);
console.log("  ✓ Cash change and Khata debt calculations verified.");

// 4. Test Item Profit Calculation
console.log("\n[TEST 4] Testing Item-level Unit & Line Profit...");
// salePrice = 200, unitCost = 120, qty = 5, discount = 50
// revenue = 200 * 5 - 50 = 950
// cost = 120 * 5 = 600
// profit = 950 - 600 = 350
const profit = calculateItemProfit(200, 120, 5, 50);
assert.strictEqual(profit, 350, "Item profit should be 350");
console.log("  ✓ Item profit calculations verified.");

// 5. Test Pure Client-Side FIFO Allocations
console.log("\n[TEST 5] Testing Client-Side computeFIFOAllocations...");
const batches = [
  { _id: "b1", batchCode: "B-01", availableQty: 10, unitCost: 100, createdAt: "2026-01-01" },
  { _id: "b2", batchCode: "B-02", availableQty: 10, unitCost: 140, createdAt: "2026-02-01" },
];

const fifoRes = computeFIFOAllocations(batches, 14, 100);
assert.strictEqual(fifoRes.allocations.length, 2);
assert.strictEqual(fifoRes.allocations[0].batchCode, "B-01");
assert.strictEqual(fifoRes.allocations[0].quantity, 10);
assert.strictEqual(fifoRes.allocations[1].batchCode, "B-02");
assert.strictEqual(fifoRes.allocations[1].quantity, 4);
// totalCost = (10 * 100) + (4 * 140) = 1000 + 560 = 1560
assert.strictEqual(fifoRes.totalCost, 1560);
assert.strictEqual(fifoRes.unitCost, 111.43, "1560 / 14 = 111.43");

// Verify original batches were not mutated
assert.strictEqual(batches[0].availableQty, 10, "Original batch 1 should not be mutated");
assert.strictEqual(batches[1].availableQty, 10, "Original batch 2 should not be mutated");

console.log("  ✓ Client-side FIFO simulation verified without input mutation.");

console.log("\n=================================================");
console.log("ALL FRONTEND CALCULATOR TESTS PASSED!");
console.log("=================================================");
