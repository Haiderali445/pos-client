import React from "react";
import { Button, Modal, Segmented, Spin, Tag, Tooltip } from "antd";
import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import { Thermal80mmTemplate, StandardA4Template } from "../templates";
import { usePrintInvoice } from "../hooks/usePrintInvoice";

export default function InvoicePreviewModal({
  open,
  onClose,
  bill = {},
  tenant = {},
  defaultTemplate = "thermal80mm",
}) {
  const { printRef, printNow, generatePDF, isPrinting, selectedTemplate, setTemplate } =
    usePrintInvoice(defaultTemplate);

  const TemplateComponent =
    selectedTemplate === "standardA4" ? StandardA4Template : Thermal80mmTemplate;

  const is80mm = selectedTemplate === "thermal80mm";

  return (
    <Modal
      centered
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "#183c35" }}>Invoice Preview</span>
          {bill.status === "voided" && (
            <Tag color="red" style={{ fontSize: 11 }}>
              VOIDED
            </Tag>
          )}
          <Segmented
            size="small"
            value={selectedTemplate}
            onChange={setTemplate}
            options={[
              { label: "Thermal 80mm", value: "thermal80mm" },
              { label: "A4 Invoice", value: "standardA4" },
            ]}
          />
        </div>
      }
      open={open}
      onCancel={onClose}
      width={is80mm ? 460 : 860}
      styles={{
        body: {
          backgroundColor: "#f4f6f3",
          padding: "16px",
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        },
      }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Tooltip key="pdf-tip" title="Export invoice as PDF file">
          <Button
            key="pdf"
            icon={<DownloadOutlined />}
            loading={isPrinting}
            onClick={generatePDF}
          >
            Download PDF
          </Button>
        </Tooltip>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={printNow}
          style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
        >
          Print
        </Button>,
      ]}
    >
      <Spin spinning={isPrinting} tip="Generating PDF...">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              borderRadius: 4,
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <TemplateComponent ref={printRef} bill={bill} tenant={tenant} />
          </div>
        </div>
      </Spin>
    </Modal>
  );
}