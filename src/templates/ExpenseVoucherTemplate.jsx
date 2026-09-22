import React from "react";

const ExpenseVoucherTemplate = React.forwardRef(function ExpenseVoucherTemplate(
  { charge = {}, tenant = {} },
  ref
) {
  const storeName = tenant.name || "Hardware Point";
  const currency = tenant.currency || "PKR";
  const fmt = (n) => `${currency} ${Number(n).toFixed(2)}`;
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" }) : "-";

  return (
    <div
      ref={ref}
      className="expense-voucher"
      style={{
        width: "148mm",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        fontSize: 13,
        color: "#17251f",
        backgroundColor: "#fff",
        padding: "16mm 14mm",
        boxSizing: "border-box",
        border: "1px solid #183c35",
        borderRadius: 4,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#183c35" }}>{storeName}</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>EXPENSE VOUCHER</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#666" }}>
          <div>Date: {fmtDate(charge.date)}</div>
          <div>Voucher #: {(charge._id || "").slice(-6).toUpperCase()}</div>
        </div>
      </div>

      <div style={{ borderTop: "2px solid #183c35", paddingTop: 16, marginBottom: 16 }}>
        <table style={{ width: "100%" }}>
          <tbody>
            <tr style={{ marginBottom: 8 }}>
              <td style={{ width: 140, fontWeight: 600, paddingBottom: 8 }}>Category:</td>
              <td style={{ paddingBottom: 8, textTransform: "capitalize" }}>
                {charge.category || "General"}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, paddingBottom: 8 }}>Description:</td>
              <td style={{ paddingBottom: 8 }}>{charge.description}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Amount:</td>
              <td style={{ fontWeight: 700, fontSize: 16, color: "#183c35" }}>{fmt(charge.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 32,
          paddingTop: 12,
          borderTop: "1px dashed #ccc",
          fontSize: 11,
          color: "#888",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: 120, marginBottom: 4 }} />
          Authorized By
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: 120, marginBottom: 4 }} />
          Received By
        </div>
      </div>
    </div>
  );
});

export default ExpenseVoucherTemplate;
