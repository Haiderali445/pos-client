import React from "react";

const Thermal80mmTemplate = React.forwardRef(function Thermal80mmTemplate(
  { bill = {}, tenant = {} },
  ref
) {
  const storeName = tenant.name || "Hardware Point";
  const phone = tenant.contactPhone || "";
  const address = tenant.address || "";
  const currency = tenant.currency || "PKR";

  const subtotal = Number(bill.subtotal ?? bill.totalAmount ?? 0);
  const taxAmount = Number(bill.taxAmount ?? 0);
  const totalAmount = Number(bill.totalAmount ?? 0);
  const paidAmount = Number(bill.paidAmount ?? 0);
  const balanceDue = Math.max(0, totalAmount - paidAmount);
  const cartItems = bill.cartItems || [];

  const fmt = (n) => `${currency} ${Number(n).toFixed(2)}`;
  const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "-");

  return (
    <div
      ref={ref}
      className="thermal-receipt"
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
      {/* Store Header */}
      <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1, marginBottom: 2 }}>
        {storeName}
      </div>
      {address && (
        <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>{address}</div>
      )}
      {phone && (
        <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>Tel: {phone}</div>
      )}

      <div style={{ borderBottom: "1px dashed #888", marginBottom: 8 }} />

      {/* Invoice Meta */}
      <div style={{ textAlign: "left", fontSize: 11, marginBottom: 8 }}>
        <div>
          <strong>Invoice #:</strong>{" "}
          <span style={{ wordBreak: "break-all" }}>{bill._id || "-"}</span>
        </div>
        <div><strong>Date:</strong> {fmtDate(bill.date)}</div>
        <div><strong>Customer:</strong> {bill.costumerName || "Walk-in Customer"}</div>
        {bill.costumerNumber && (
          <div><strong>Phone:</strong> {bill.costumerNumber}</div>
        )}
        <div><strong>Payment:</strong> {(bill.paymentMethod || "cash").toUpperCase()}</div>
        {bill.operatorId && (
          <div><strong>Operator:</strong> {bill.operatorId}</div>
        )}
      </div>

      <div style={{ borderBottom: "1px dashed #888", marginBottom: 8 }} />

      {/* Line Items */}
      <div style={{ textAlign: "left", marginBottom: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            borderBottom: "1px solid #000",
            paddingBottom: 4,
            marginBottom: 4,
            fontSize: 11,
          }}
        >
          <span style={{ flex: 2 }}>Item</span>
          <span style={{ flex: 1, textAlign: "center" }}>Qty</span>
          <span style={{ flex: 1, textAlign: "right" }}>Total</span>
        </div>

        {cartItems.map((item, idx) => (
          <div
            key={item._id || idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              padding: "2px 0",
            }}
          >
            <span
              style={{
                flex: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 120,
              }}
            >
              {item.name}
            </span>
            <span style={{ flex: 1, textAlign: "center" }}>{item.quantity}</span>
            <span style={{ flex: 1, textAlign: "right" }}>
              {fmt((item.quantity || 1) * (item.salePrice || item.price || 0))}
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #888", paddingTop: 8, textAlign: "right", fontSize: 12 }}>
        {taxAmount > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal:</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tax:</span>
              <span>{fmt(taxAmount)}</span>
            </div>
          </>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
          <span>TOTAL:</span>
          <span>{fmt(totalAmount)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Paid:</span>
          <span>{fmt(paidAmount)}</span>
        </div>
        {balanceDue > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "#cf1322", fontWeight: 700 }}>
            <span>Balance Due:</span>
            <span>{fmt(balanceDue)}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "#555", textAlign: "center" }}>
        *** Thank You for Your Business! ***
      </div>
    </div>
  );
});

export default Thermal80mmTemplate;
