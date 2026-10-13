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

  const isCustomer = account.accountType === "Customer";
  const totalBilled = transactions
    .filter((t) => t.invoiceType === (isCustomer ? "Sale" : "Purchase"))
    .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
  const totalPaid = transactions
    .reduce(
      (sum, t) =>
        sum +
        Number(t.invoiceType === "Payment" ? t.paidAmount || t.totalAmount || 0 : t.paidAmount || 0),
      0
    );
  const currentDebt = Number(account.currentBalance || 0);
  const balanceLabel = currentDebt > 0
    ? isCustomer ? "Customer owes you" : "You owe supplier"
    : currentDebt < 0
    ? isCustomer ? "Customer credit" : "Supplier advance"
    : "All settled";

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
          <strong>{balanceLabel}:</strong>{" "}
          <span style={{ fontWeight: 800, color: currentDebt > 0 ? "#cf1322" : "#2d8a55" }}>
            {fmt(Math.abs(currentDebt))}
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
          <span style={{ flex: 1.4 }}>Date / Invoice</span>
          <span style={{ flex: 1, textAlign: "right" }}>Amount</span>
          <span style={{ flex: 1, textAlign: "right" }}>Paid</span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "10px 0", color: "#888", fontSize: 11 }}>
            No transaction records found.
          </div>
        ) : (
          transactions.map((tx) => {
            const isPayment = tx.invoiceType === "Payment";
            const type = isPayment
              ? isCustomer ? "Payment received" : "Payment made"
              : tx.invoiceType || (isCustomer ? "Sale" : "Purchase");
            const invoice = tx.invoiceNumber || (tx.billId || tx.reference_id || "");
            const amount = isPayment
              ? Number(tx.paidAmount || tx.totalAmount || 0)
              : Number(tx.totalAmount || 0);
            const paid = Number(tx.paidAmount || 0);

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
                <div style={{ flex: 1.4, overflow: "hidden" }}>
                  <div>{fmtDate(tx.date || tx.createdAt)}</div>
                  <div style={{ fontSize: 9, color: "#666" }}>
                    {type}{invoice ? ` · ${invoice}` : ""}
                  </div>
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  {fmt(amount)}
                </div>
                <div style={{ flex: 1, textAlign: "right", color: "#2d8a55" }}>
                  {!isPayment && paid > 0 ? fmt(paid) : "-"}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary totals */}
      <div style={{ borderTop: "1px dashed #888", paddingTop: 6, textAlign: "right", fontSize: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{isCustomer ? "Total sales" : "Total purchases"}:</span>
          <span>{fmt(totalBilled)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{isCustomer ? "Payments received" : "Payments made"}:</span>
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
          <span>{balanceLabel}:</span>
          <span style={{ color: currentDebt > 0 ? "#cf1322" : "#2d8a55" }}>
            {fmt(Math.abs(currentDebt))}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: "#555", textAlign: "center" }}>
        *** Account Statement ***
      </div>
    </div>
  );
});

export default KhataStatementTemplate;
