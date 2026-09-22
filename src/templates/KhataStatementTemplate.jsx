import React from "react";

const KhataStatementTemplate = React.forwardRef(function KhataStatementTemplate(
  { account = {}, transactions = [], tenant = {} },
  ref
) {
  const storeName = tenant.name || "Hardware Point";
  const phone = tenant.contactPhone || "";
  const address = tenant.address || "";
  const currency = tenant.currency || "PKR";

  const fmt = (n) => `${currency} ${Number(n || 0).toFixed(2)}`;
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "-");

  const totalBilled = transactions
    .filter((t) => t.invoiceType === "Sale")
    .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
  const totalPaid = transactions.reduce((sum, t) => sum + Number(t.paidAmount || 0), 0);
  const currentDebt = Number(account.currentBalance || 0);

  return (
    <div
      ref={ref}
      className="khata-statement-receipt"
      style={{
        width: "80mm",
        maxWidth: "80mm",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 12,
        color: "#000",
        backgroundColor: "#fff",
        padding: "12px 8px",
        textAlign: "center",
      }}
    >
      {/* Header */}
      <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1, marginBottom: 2 }}>
        {storeName}
      </div>
      {address && <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{address}</div>}
      {phone && <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>Tel: {phone}</div>}

      <div style={{ borderBottom: "1px dashed #888", marginBottom: 8 }} />

      <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>
        KHATA STATEMENT / LEDGER
      </div>
      <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>
        Statement as of: {new Date().toLocaleString()}
      </div>

      {/* Account Info */}
      <div style={{ textAlign: "left", fontSize: 11, backgroundColor: "#f7f7f7", padding: "6px 8px", borderRadius: 4, marginBottom: 8 }}>
        <div><strong>Account:</strong> {account.name || "-"}</div>
        <div><strong>Code:</strong> {account.accountCode || "-"}</div>
        {account.phone && <div><strong>Phone:</strong> {account.phone}</div>}
        <div>
          <strong>Current Debt / Due:</strong>{" "}
          <span style={{ fontWeight: 800, color: currentDebt > 0 ? "#cf1322" : "#2d8a55" }}>
            {fmt(currentDebt)}
          </span>
        </div>
      </div>

      <div style={{ borderBottom: "1px dashed #888", marginBottom: 8 }} />

      {/* Transactions Table */}
      <div style={{ textAlign: "left", marginBottom: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            borderBottom: "1px solid #000",
            paddingBottom: 4,
            marginBottom: 4,
            fontSize: 10,
          }}
        >
          <span style={{ flex: 1.2 }}>Date / Ref</span>
          <span style={{ flex: 1, textAlign: "right" }}>Debit (+)</span>
          <span style={{ flex: 1, textAlign: "right" }}>Credit (-)</span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "10px 0", color: "#888", fontSize: 11 }}>
            No transaction records found.
          </div>
        ) : (
          transactions.map((tx, idx) => {
            const isPayment = tx.invoiceType === "Payment";
            const refNo = tx.invoiceNumber || (tx._id ? tx._id.slice(-6).toUpperCase() : `TX-${idx + 1}`);
            const debit = !isPayment ? Number(tx.totalAmount || 0) : 0;
            const credit = isPayment ? Number(tx.paidAmount || 0) : Number(tx.paidAmount || 0);

            return (
              <div
                key={tx._id || idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  padding: "3px 0",
                  borderBottom: "1px dotted #ccc",
                }}
              >
                <div style={{ flex: 1.2, overflow: "hidden" }}>
                  <div>{fmtDate(tx.date || tx.createdAt)}</div>
                  <div style={{ fontSize: 9, color: "#666" }}>
                    {isPayment ? "Payment" : "Sale"} #{refNo}
                  </div>
                </div>
                <div style={{ flex: 1, textAlign: "right", color: debit > 0 ? "#cf1322" : "#000" }}>
                  {debit > 0 ? fmt(debit) : "-"}
                </div>
                <div style={{ flex: 1, textAlign: "right", color: credit > 0 ? "#2d8a55" : "#000" }}>
                  {credit > 0 ? fmt(credit) : "-"}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary totals */}
      <div style={{ borderTop: "1px dashed #888", paddingTop: 6, textAlign: "right", fontSize: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Total Sales Billed:</span>
          <span>{fmt(totalBilled)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Total Payments Made:</span>
          <span>{fmt(totalPaid)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 800,
            fontSize: 12,
            marginTop: 4,
            paddingTop: 4,
            borderTop: "1px solid #000",
          }}
        >
          <span>NET BALANCE DUE:</span>
          <span style={{ color: currentDebt > 0 ? "#cf1322" : "#2d8a55" }}>
            {fmt(currentDebt)}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: "#555", textAlign: "center" }}>
        *** Verified Customer Khata Ledger ***
      </div>
    </div>
  );
});

export default KhataStatementTemplate;
