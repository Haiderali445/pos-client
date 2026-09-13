import React from "react";

const PurchaseOrderTemplate = React.forwardRef(function PurchaseOrderTemplate(
  { dealer = {}, items = [], tenant = {} },
  ref
) {
  const storeName = tenant.name || "Hardware Point";
  const currency = tenant.currency || "PKR";
  const fmt = (n) => `${currency} ${Number(n).toFixed(2)}`;
  const grandTotal = items.reduce(
    (sum, item) => sum + (item.quantity || 1) * (item.purchasePrice || 0),
    0
  );

  return (
    <div
      ref={ref}
      className="purchase-order"
      style={{
        width: "210mm",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        fontSize: 13,
        color: "#17251f",
        backgroundColor: "#fff",
        padding: "20mm 18mm",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#183c35" }}>{storeName}</div>
          {tenant.address && <div style={{ fontSize: 12, color: "#666" }}>{tenant.address}</div>}
          {tenant.contactPhone && <div style={{ fontSize: 12, color: "#666" }}>Tel: {tenant.contactPhone}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#183c35" }}>PURCHASE ORDER</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            Date: {new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Vendor Info */}
      <div
        style={{
          backgroundColor: "#f4f7f3",
          padding: "14px 16px",
          borderRadius: 6,
          marginBottom: 24,
          borderLeft: "4px solid #183c35",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Vendor / Supplier
        </div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{dealer.dealerName || dealer.shopName}</div>
        {dealer.shopName && dealer.dealerName !== dealer.shopName && (
          <div style={{ color: "#555" }}>{dealer.shopName}</div>
        )}
        {dealer.contactName && <div style={{ color: "#555" }}>Attn: {dealer.contactName}</div>}
        {dealer.address && <div style={{ color: "#555" }}>{dealer.address}</div>}
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr style={{ backgroundColor: "#183c35", color: "#f2c14e" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12 }}>#</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12 }}>Item</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12 }}>SKU</th>
            <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12 }}>Qty</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12 }}>Unit Cost</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #e8f0ec", backgroundColor: idx % 2 === 0 ? "#f9faf7" : "#fff" }}>
              <td style={{ padding: "10px 12px", color: "#888" }}>{idx + 1}</td>
              <td style={{ padding: "10px 12px", fontWeight: 500 }}>{item.name}</td>
              <td style={{ padding: "10px 12px", color: "#888", fontFamily: "monospace" }}>{item.sku || "-"}</td>
              <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.quantity || 1}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmt(item.purchasePrice || 0)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                {fmt((item.quantity || 1) * (item.purchasePrice || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Grand Total */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 16px",
            backgroundColor: "#183c35",
            color: "#f2c14e",
            fontWeight: 700,
            fontSize: 15,
            borderRadius: 6,
            minWidth: 240,
          }}
        >
          <span>Grand Total</span>
          <span>{fmt(grandTotal)}</span>
        </div>
      </div>

      {/* Signature Block */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed #ccc", fontSize: 11, color: "#888" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: 160, marginBottom: 4 }} />
          Ordered By
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #333", width: 160, marginBottom: 4 }} />
          Supplier Acknowledgment
        </div>
      </div>
    </div>
  );
});

export default PurchaseOrderTemplate;
