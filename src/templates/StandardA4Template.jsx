import React from "react";
import { Divider, Tag } from "antd";

const StandardA4Template = React.forwardRef(function StandardA4Template(
  { bill = {}, tenant = {} },
  ref
) {
  const storeName = tenant.name || "Hardware Point";
  const phone = tenant.contactPhone || "";
  const address = tenant.address || "";
  const currency = tenant.currency || "PKR";

  const subtotal = Number(bill.subtotal ?? bill.totalAmount ?? 0);
  const totalDiscount = Number(bill.totalDiscount || bill.discount || 0);
  const taxAmount = Number(bill.taxAmount ?? 0);
  const fare = Number(bill.fare || 0);
  const totalAmount = Number(bill.totalAmount ?? 0);
  const paidAmount = Number(bill.paidAmount ?? 0);
  const balanceDue = Math.max(0, totalAmount - paidAmount);
  const change = Math.max(0, paidAmount - totalAmount);
  const isPaid = paidAmount >= totalAmount;
  const cartItems = bill.cartItems || [];

  const fmt = (n) => `${currency} ${Number(n).toFixed(2)}`;
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-PK", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

  return (
    <div
      ref={ref}
      className="a4-invoice"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        fontSize: 13,
        color: "#17251f",
        backgroundColor: "#fff",
        padding: "24mm 20mm",
        boxSizing: "border-box",
      }}
    >
      {/* Letterhead */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#183c35", letterSpacing: -0.5 }}>
            {storeName}
          </div>
          {address && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{address}</div>}
          {phone && <div style={{ fontSize: 12, color: "#666" }}>Tel: {phone}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#183c35" }}>INVOICE</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            # {(bill._id || "").slice(-8).toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>{fmtDate(bill.date)}</div>
          <div style={{ marginTop: 8 }}>
            <Tag color={isPaid ? "success" : "error"} style={{ fontSize: 12, padding: "2px 10px" }}>
              {isPaid ? "PAID" : "PARTIAL / DUE"}
            </Tag>
          </div>
        </div>
      </div>

      <Divider style={{ borderColor: "#183c35", borderWidth: 2 }} />

      {/* Billed To */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Billed To
        </div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{bill.costumerName || "Walk-in Customer"}</div>
        {bill.costumerNumber && (
          <div style={{ fontSize: 13, color: "#555" }}>Phone: {bill.costumerNumber}</div>
        )}
        <div style={{ fontSize: 13, color: "#555" }}>
          Payment Method: {(bill.paymentMethod || "cash").toUpperCase()}
        </div>
        {bill.operatorId && (
          <div style={{ fontSize: 13, color: "#555" }}>Served by: {bill.operatorId}</div>
        )}
      </div>

      {/* Line Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr style={{ backgroundColor: "#183c35", color: "#f2c14e" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700 }}>#</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700 }}>Description</th>
            <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 700 }}>Qty</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 700 }}>Unit Price</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 700 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item, idx) => (
            <tr
              key={item._id || idx}
              style={{ borderBottom: "1px solid #e8f0ec", backgroundColor: idx % 2 === 0 ? "#f9faf7" : "#fff" }}
            >
              <td style={{ padding: "10px 12px", color: "#888" }}>{idx + 1}</td>
              <td style={{ padding: "10px 12px", fontWeight: 500 }}>{item.name}</td>
              <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.quantity}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>
                {fmt(item.salePrice || item.price || 0)}
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                {fmt((item.quantity || 1) * (item.salePrice || item.price || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Summary */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 280 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "#666" }}>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#2d8a55" }}>
              <span>Discount (-)</span>
              <span>-{fmt(totalDiscount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
              <span style={{ color: "#666" }}>Tax / GST</span>
              <span>+{fmt(taxAmount)}</span>
            </div>
          )}
          {fare > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
              <span style={{ color: "#666" }}>Transport / Fare</span>
              <span>+{fmt(fare)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              backgroundColor: "#183c35",
              color: "#f2c14e",
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 6,
              marginTop: 6,
              marginBottom: 8,
            }}
          >
            <span>Grand Total</span>
            <span>{fmt(totalAmount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "#666" }}>Amount Received</span>
            <span style={{ color: "#2d8a55", fontWeight: 600 }}>{fmt(paidAmount)}</span>
          </div>
          {change > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#2d8a55" }}>
              <span>Change Returned</span>
              <span>{fmt(change)}</span>
            </div>
          )}
          {balanceDue > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: 13,
                fontWeight: 700,
                color: "#cf1322",
              }}
            >
              <span>Balance Remaining</span>
              <span>{fmt(balanceDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 48,
          paddingTop: 16,
          borderTop: "1px solid #e8f0ec",
          textAlign: "center",
          fontSize: 11,
          color: "#888",
        }}
      >
        Thank you for your business. This is a computer-generated invoice.
      </div>
    </div>
  );
});

export default StandardA4Template;
