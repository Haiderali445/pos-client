import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
  FileDoneOutlined,
  InboxOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SendOutlined,
  ShopOutlined,
  SolutionOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { usePrintInvoice } from "../hooks/usePrintInvoice";
import DefaultLayout from "../components/Defaultlayouts";
import {
  useAccounts,
  useBills,
  useCheckoutMutation,
  useGoodsReceiptMutation,
  useGoodsReceipts,
  useProducts,
} from "../hooks/usePosQueries";
import { useTenantSettings } from "../hooks/useTenantSettings";
import PurchaseOrderTemplate from "../templates/PurchaseOrderTemplate";
import "../styles/Pos.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function PurchaseOrderPage() {
  const { tenantSettings } = useTenantSettings();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useAccounts({
    accountType: "Supplier",
  });
  const { data: bills = [] } = useBills();
  const { data: goodsReceipts = [] } = useGoodsReceipts();
  const checkoutMutation = useCheckoutMutation();
  const goodsReceiptMutation = useGoodsReceiptMutation();

  // Multi-step workflow state: 0 = Draft, 1 = Sent / Approved, 2 = GRN / Receive Stock
  const [currentStep, setCurrentStep] = useState(0);

  // Active PO state
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [poItems, setPoItems] = useState([]);
  const [poNotes, setPoNotes] = useState("");
  const [poNumber, setPoNumber] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [createdPurchaseInvoiceId, setCreatedPurchaseInvoiceId] = useState(null);

  // Receiving state
  const [receivingItems, setReceivingItems] = useState([]);
  const [fare, setFare] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("borrow"); // credit payable by default
  const [paidAmount, setPaidAmount] = useState(0);

  // Print hook
  const { printRef: poPrintRef, printNow: handlePrintPO } = usePrintInvoice("standardA4");

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => String(s._id) === String(selectedSupplierId)),
    [suppliers, selectedSupplierId]
  );

  // Calculate Draft / PO Totals
  const poSubtotal = useMemo(
    () =>
      poItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.purchasePrice) || 0),
        0
      ),
    [poItems]
  );

  // Calculate Receiving Total
  const grnTotal = useMemo(() => {
    return Number(receivingItems.reduce(
      (sum, item) => sum + (Number(item.receivedQty) || 0) * (Number(item.batchCost) || 0),
      0
    ).toFixed(2));
  }, [receivingItems]);

  const purchaseInvoiceTotal = useMemo(
    () => Number((poSubtotal + Number(fare || 0)).toFixed(2)),
    [poSubtotal, fare]
  );

  const pendingPurchaseInvoices = useMemo(() => {
    return bills.filter((bill) => {
      if (bill.invoiceType !== "Purchase" || bill.status !== "completed") return false;
      const receivedByProduct = new Map();
      goodsReceipts
        .filter((receipt) =>
          receipt.status !== "voided" &&
          String(receipt.purchaseInvoiceId?._id || receipt.purchaseInvoiceId) === String(bill._id)
        )
        .forEach((receipt) => {
          (receipt.items || []).forEach((line) => {
            const productId = String(line.productId);
            receivedByProduct.set(productId, (receivedByProduct.get(productId) || 0) + Number(line.quantity || 0));
          });
        });
      return (bill.cartItems || []).some((line) => {
        const productId = String(line.productId || "");
        return productId && Number(line.quantity || 0) - (receivedByProduct.get(productId) || 0) > 0.0005;
      });
    });
  }, [bills, goodsReceipts]);

  // Add Item to Draft PO
  const handleAddItemToPO = (productId) => {
    if (!productId) return;
    const prod = products.find((p) => String(p._id) === String(productId));
    if (!prod) return;

    if (poItems.some((i) => String(i.productId) === String(productId))) {
      message.info("Item already in purchase order list.");
      return;
    }

    setPoItems((prev) => [
      ...prev,
      {
        productId: prod._id,
        name: prod.name,
        sku: prod.sku || "",
        barcode: prod.barcode || "",
        category: prod.category || "General",
        currentStock: prod.stock || 0,
        quantity: 10,
        purchasePrice: Number(prod.purchasePrice || 0),
        expectedBatchCode: `BATCH-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      },
    ]);
  };

  const handleUpdateItemQty = (productId, qty) => {
    setPoItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Number(qty) || 1) } : i))
    );
  };

  const handleUpdateItemCost = (productId, cost) => {
    setPoItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, purchasePrice: Math.max(0, Number(cost) || 0) } : i
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setPoItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Step 1 -> Step 2 (Approve / Send PO)
  const handleProceedToSent = () => {
    if (!selectedSupplierId) {
      message.error("Please select a vendor / supplier.");
      return;
    }
    if (poItems.length === 0) {
      message.error("Please add at least one item to the purchase order.");
      return;
    }
    setCurrentStep(1);
    message.success("Purchase order finalized and ready for transmission.");
  };

  // Step 2 -> Step 3 (Prepare GRN Receiving)
  const handleProceedToGRN = () => {
    setReceivingItems(
      poItems.map((item) => ({
        ...item,
        receivedQty: item.quantity,
        batchCost: item.purchasePrice,
        batchCode:
          item.expectedBatchCode ||
          `BATCH-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      }))
    );
    setCreatedPurchaseInvoiceId(null);
    setCurrentStep(2);
  };

  const handleReceiveRemaining = (invoice) => {
    const receivedByProduct = new Map();
    goodsReceipts
      .filter((receipt) =>
        receipt.status !== "voided" &&
        String(receipt.purchaseInvoiceId?._id || receipt.purchaseInvoiceId) === String(invoice._id)
      )
      .forEach((receipt) => {
        (receipt.items || []).forEach((line) => {
          const productId = String(line.productId);
          receivedByProduct.set(productId, (receivedByProduct.get(productId) || 0) + Number(line.quantity || 0));
        });
      });

    const lines = (invoice.cartItems || []).map((line) => {
      const productId = String(line.productId || line._id || "");
      const remaining = Math.max(
        0,
        Number(line.quantity || 0) - (receivedByProduct.get(productId) || 0)
      );
      return {
        productId,
        name: line.name,
        sku: line.sku || "",
        currentStock: products.find((product) => String(product._id) === productId)?.stock || 0,
        quantity: remaining,
        receivedQty: remaining,
        purchasePrice: Number(line.unitCost || line.purchasePrice || line.unitPrice || 0),
        batchCost: Number(line.unitCost || line.purchasePrice || line.unitPrice || 0),
        batchCode: `BATCH-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      };
    }).filter((line) => line.receivedQty > 0);

    setSelectedSupplierId(invoice.accountId?._id || invoice.accountId || null);
    setPoItems(lines);
    setReceivingItems(lines);
    setCreatedPurchaseInvoiceId(invoice._id);
    setFare(0);
    setPaidAmount(0);
    setCurrentStep(2);
  };

  // Create the supplier invoice first; the GRN then posts only the received quantities to stock.
  const handleFinalizeGRN = async () => {
    let purchaseInvoiceId = createdPurchaseInvoiceId;
    try {
      if (!receivingItems.some((item) => Number(item.receivedQty) > 0)) {
        message.error("Enter at least one received quantity greater than zero.");
        return;
      }
      if (!purchaseInvoiceId) {
        if (!supplierInvoiceNumber.trim()) {
          message.error("Enter the supplier's invoice number before saving the purchase invoice.");
          return;
        }
        const purchaseInvoice = await checkoutMutation.mutateAsync({
          invoiceType: "Purchase",
          invoiceNumber: supplierInvoiceNumber.trim(),
          accountId: selectedSupplierId,
          costumerName: selectedSupplier?.name || "Supplier",
          costumerNumber: selectedSupplier?.phone || "",
          fare: Number(fare || 0),
          totalDiscount: 0,
          paidAmount: Number(paidAmount || 0),
          paymentMethod,
          notes: poNotes,
          cartItems: poItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            barcode: item.barcode,
            category: item.category,
            quantity: Number(item.quantity),
            unitCost: Number(item.purchasePrice),
            purchasePrice: Number(item.purchasePrice),
          })),
          date: new Date().toISOString(),
        });
        purchaseInvoiceId = purchaseInvoice._id;
        setCreatedPurchaseInvoiceId(purchaseInvoiceId);
      }

      const receipt = await goodsReceiptMutation.mutateAsync({
        purchaseInvoiceId,
        items: receivingItems
          .filter((item) => Number(item.receivedQty) > 0)
          .map((item) => ({
            productId: item.productId,
            quantity: Number(item.receivedQty),
          })),
        notes: poNotes,
        date: new Date().toISOString(),
      });
      message.success(
        `Purchase invoice and GRN ${receipt.grnNumber} saved. Stock was updated only for the received quantities.`
      );

      // Reset
      setCurrentStep(0);
      setPoItems([]);
      setReceivingItems([]);
      setPoNumber(`PO-${Date.now().toString().slice(-6)}`);
      setSupplierInvoiceNumber("");
      setCreatedPurchaseInvoiceId(null);
    } catch (err) {
      if (purchaseInvoiceId && !createdPurchaseInvoiceId) {
        setCreatedPurchaseInvoiceId(purchaseInvoiceId);
      }
      message.error(
        purchaseInvoiceId
          ? `Purchase invoice saved, but GRN failed: ${err.response?.data?.error || err.message}`
          : err.response?.data?.error || err.message || "Failed to save purchase invoice"
      );
    }
  };

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 50 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 12, color: "#2d8a55", fontWeight: 700, textTransform: "uppercase" }}>
              Procurement & FIFO Intake
            </span>
            <Title level={2} style={{ margin: 0, color: "#183c35" }}>
              Purchase Invoices & Goods Receiving (GRN)
            </Title>
          </div>
          <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px", fontWeight: 700 }}>
            {poNumber}
          </Tag>
        </div>

        {/* Workflow Steps Indicator */}
        <Card bordered={false} style={{ borderRadius: 10, marginBottom: 24 }}>
          <Steps
            current={currentStep}
            items={[
              {
                title: "1. Prepare Invoice",
                description: "Select supplier & products",
                icon: <SolutionOutlined />,
              },
              {
                title: "2. Review",
                description: "Check supplier and quantities",
                icon: <SendOutlined />,
              },
              {
                title: "3. Purchase Invoice & GRN",
                description: "Record invoice, then stock receipt",
                icon: <InboxOutlined />,
              },
            ]}
          />
        </Card>

        {/* STEP 1: DRAFT ORDER */}
        {currentStep === 0 && (
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={16}>
              <Card
                bordered={false}
                title={<span style={{ color: "#183c35", fontWeight: 700 }}>Line Items to Order</span>}
                style={{ borderRadius: 10 }}
                extra={
                  <Select
                    showSearch
                    placeholder="+ Add Product to Order"
                    style={{ width: 260 }}
                    loading={loadingProducts}
                    onChange={handleAddItemToPO}
                    value={null}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    options={products.map((p) => ({
                      value: p._id,
                      label: `${p.name} (Stock: ${p.stock})`,
                    }))}
                  />
                }
              >
                {poItems.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No products added yet. Select items from the catalog above."
                  />
                ) : (
                  <Table
                    rowKey="productId"
                    dataSource={poItems}
                    pagination={false}
                    columns={[
                      {
                        title: "Product",
                        key: "name",
                        render: (_, item) => (
                          <div>
                            <strong>{item.name}</strong>
                            <div style={{ fontSize: 11, color: "#888" }}>
                              SKU: {item.sku || "N/A"} | Current: {item.currentStock}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Qty",
                        key: "qty",
                        width: 100,
                        render: (_, item) => (
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={(val) => handleUpdateItemQty(item.productId, val)}
                            style={{ width: 80 }}
                          />
                        ),
                      },
                      {
                        title: "Unit Cost (PKR)",
                        key: "cost",
                        width: 130,
                        render: (_, item) => (
                          <InputNumber
                            min={0}
                            precision={2}
                            value={item.purchasePrice}
                            onChange={(val) => handleUpdateItemCost(item.productId, val)}
                            style={{ width: 110 }}
                          />
                        ),
                      },
                      {
                        title: "Total",
                        key: "total",
                        align: "right",
                        render: (_, item) =>
                          `PKR ${(Number(item.quantity || 1) * Number(item.purchasePrice || 0)).toFixed(2)}`,
                      },
                      {
                        title: "",
                        key: "actions",
                        width: 50,
                        render: (_, item) => (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveItem(item.productId)}
                          />
                        ),
                      },
                    ]}
                  />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                bordered={false}
                title={<span style={{ color: "#183c35", fontWeight: 700 }}>Supplier & Terms</span>}
                style={{ borderRadius: 10 }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Select Supplier / Vendor:
                  </Text>
                  <Select
                    showSearch
                    placeholder="Choose registered supplier..."
                    style={{ width: "100%" }}
                    value={selectedSupplierId}
                    onChange={(id) => setSelectedSupplierId(id)}
                    loading={loadingSuppliers}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    options={suppliers.map((s) => ({
                      value: s._id,
                      label: `${s.name} (${s.accountCode}) - Due: PKR ${Number(s.currentBalance || 0).toFixed(2)}`,
                    }))}
                  />
                </div>

                {selectedSupplier && (
                  <div
                    style={{
                      background: "#f4f8f5",
                      border: "1px solid #d5e5db",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 16,
                      fontSize: 12,
                    }}
                  >
                    <div><strong>Contact:</strong> {selectedSupplier.phone || "No phone"}</div>
                    <div><strong>Address:</strong> {selectedSupplier.address || "N/A"}</div>
                    <div>
                      <strong>Payable Balance:</strong>{" "}
                      <span style={{ color: "#cf1322", fontWeight: 700 }}>
                        PKR {Number(selectedSupplier.currentBalance || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Notes / Delivery Instructions:
                  </Text>
                  <Input.TextArea
                    rows={3}
                    placeholder="Specify payment or transport conditions..."
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: "#183c35",
                    color: "#fff",
                    padding: "14px 18px",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase" }}>
                    Estimated Order Total
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#f2c14e" }}>
                    PKR {poSubtotal.toFixed(2)}
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<SendOutlined />}
                  style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
                  disabled={!selectedSupplierId || poItems.length === 0}
                  onClick={handleProceedToSent}
                >
                  Continue to Invoice Review
                </Button>
              </Card>
            </Col>
          </Row>
        )}

        {/* STEP 2: SENT / APPROVED ORDER */}
        {currentStep === 1 && (
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <Title level={4} style={{ margin: 0, color: "#183c35" }}>
                  Purchase Invoice Ready to Receive
                </Title>
                <Text type="secondary">
                  Supplier: <strong>{selectedSupplier?.name}</strong> |                   Order reference: <strong>{poNumber}</strong>
                </Text>
              </div>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>Back to Edit</Button>
                <Button icon={<PrinterOutlined />} onClick={handlePrintPO}>
                  Print Order Copy
                </Button>
                <Button
                  type="primary"
                  icon={<InboxOutlined />}
                  style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
                  onClick={handleProceedToGRN}
                >
                  Proceed to Goods Receipt (GRN)
                </Button>
              </Space>
            </div>

            <Table
              rowKey="productId"
              dataSource={poItems}
              pagination={false}
              columns={[
                { title: "#", render: (_, __, i) => i + 1, width: 50 },
                { title: "Product Description", dataIndex: "name", key: "name" },
                { title: "SKU", dataIndex: "sku", key: "sku", render: (s) => s || "-" },
                { title: "Ordered Qty", dataIndex: "quantity", key: "quantity", align: "center" },
                {
                  title: "Agreed Unit Cost",
                  dataIndex: "purchasePrice",
                  key: "purchasePrice",
                  align: "right",
                  render: (c) => `PKR ${Number(c).toFixed(2)}`,
                },
                {
                  title: "Total Amount",
                  key: "total",
                  align: "right",
                  render: (_, item) =>
                    `PKR ${(Number(item.quantity) * Number(item.purchasePrice)).toFixed(2)}`,
                },
              ]}
            />

            {/* Hidden Printable PO */}
            <div style={{ display: "none" }}>
              <PurchaseOrderTemplate
                ref={poPrintRef}
                dealer={{
                  dealerName: selectedSupplier?.name,
                  shopName: selectedSupplier?.name,
                  contactName: selectedSupplier?.name,
                  address: selectedSupplier?.address,
                }}
                items={poItems}
                tenant={tenantSettings}
              />
            </div>
          </Card>
        )}

        {/* STEP 3: GOODS RECEIVED NOTE (GRN) / INTAKE */}
        {currentStep === 2 && (
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={16}>
              <Card
                bordered={false}
                title={
                  <span style={{ color: "#183c35", fontWeight: 700 }}>
                    Verify Quantities & Batch Purchase Costs
                  </span>
                }
                style={{ borderRadius: 10 }}
              >
                <Alert
                  type="info"
                  showIcon
                  message="FIFO Stock Batch Generation"
                  description="Entering these received items will generate timestamped FIFO batches in your local & server inventory. If costs differ from previous purchases, a Price Audit entry will be automatically logged."
                  style={{ marginBottom: 16 }}
                />

                <Table
                  rowKey="productId"
                  dataSource={receivingItems}
                  pagination={false}
                  columns={[
                    {
                      title: "Product",
                      key: "name",
                      render: (_, item) => (
                        <div>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: 11, color: "#888" }}>
                            Batch: <Tag color="purple">{item.batchCode}</Tag>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Received Qty",
                      key: "receivedQty",
                      width: 120,
                      render: (_, item) => (
                        <InputNumber
                          min={0}
                          max={item.quantity}
                          value={item.receivedQty}
                          onChange={(val) =>
                            setReceivingItems((prev) =>
                              prev.map((i) =>
                                i.productId === item.productId
                                ? { ...i, receivedQty: Math.min(i.quantity, Math.max(0, Number(val) || 0)) }
                                : i
                              )
                            )
                          }
                          style={{ width: 90 }}
                        />
                      ),
                    },
                    {
                      title: "Invoice Unit Cost",
                      key: "batchCost",
                      width: 140,
                      render: (_, item) => `PKR ${Number(item.batchCost || 0).toFixed(2)}`,
                    },
                    {
                      title: "Batch Total",
                      key: "batchTotal",
                      align: "right",
                      render: (_, item) =>
                        `PKR ${(Number(item.receivedQty) * Number(item.batchCost)).toFixed(2)}`,
                    },
                  ]}
                />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                bordered={false}
                title={
                  <span style={{ color: "#183c35", fontWeight: 700 }}>
                    {createdPurchaseInvoiceId ? "Goods Receipt" : "Supplier Invoice"}
                  </span>
                }
                style={{ borderRadius: 10 }}
              >
                {createdPurchaseInvoiceId ? (
                  <Alert
                    type="info"
                    showIcon
                    message="This purchase invoice is already recorded"
                    description="Saving this GRN will only add the received quantities to stock. It will not create another invoice or change the supplier balance."
                    style={{ marginBottom: 16 }}
                  />
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      Supplier invoice number:
                    </Text>
                    <Input
                      value={supplierInvoiceNumber}
                      onChange={(event) => setSupplierInvoiceNumber(event.target.value)}
                      placeholder="Enter the number printed on the supplier's invoice"
                    />
                  </div>
                )}

                {!createdPurchaseInvoiceId && (
                <>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Transport Fare / Loader Charges:
                  </Text>
                  <InputNumber
                    min={0}
                    precision={2}
                    prefix={<CarOutlined style={{ color: "#888" }} />}
                    value={fare}
                    onChange={(val) => setFare(Number(val) || 0)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Payment Terms:
                  </Text>
                  <Radio.Group
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      if (e.target.value === "borrow") {
                        setPaidAmount(0);
                      } else {
                        setPaidAmount(purchaseInvoiceTotal);
                      }
                    }}
                    optionType="button"
                    buttonStyle="solid"
                    style={{ width: "100%", display: "flex" }}
                  >
                    <Radio.Button value="borrow" style={{ flex: 1, textAlign: "center" }}>
                      Credit (Khata)
                    </Radio.Button>
                    <Radio.Button value="cash" style={{ flex: 1, textAlign: "center" }}>
                      Cash Paid
                    </Radio.Button>
                    <Radio.Button value="bank" style={{ flex: 1, textAlign: "center" }}>
                      Bank
                    </Radio.Button>
                  </Radio.Group>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Amount Paid on Invoice:
                  </Text>
                  <InputNumber
                    min={0}
                    max={purchaseInvoiceTotal}
                    precision={2}
                    value={paidAmount}
                    onChange={(val) => setPaidAmount(Number(val) || 0)}
                    style={{ width: "100%" }}
                    placeholder="0.00"
                  />
                </div>

                <div
                  style={{
                    backgroundColor: "#183c35",
                    color: "#fff",
                    padding: "14px 18px",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Purchase invoice total:</span>
                    <strong style={{ color: "#f2c14e", fontSize: 20 }}>
                      PKR {purchaseInvoiceTotal.toFixed(2)}
                    </strong>
                  </div>
                  {purchaseInvoiceTotal - paidAmount > 0 && (
                    <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 4 }}>
                      Amount still owed: PKR {(purchaseInvoiceTotal - paidAmount).toFixed(2)}
                    </div>
                  )}
                </div>
                </>
                )}

                {createdPurchaseInvoiceId && (
                  <div
                    style={{
                      backgroundColor: "#183c35",
                      color: "#fff",
                      padding: "14px 18px",
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase" }}>
                      Value of goods in this receipt
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#f2c14e" }}>
                      PKR {grnTotal.toFixed(2)}
                    </div>
                  </div>
                )}

                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<FileDoneOutlined />}
                    loading={checkoutMutation.isPending || goodsReceiptMutation.isPending}
                    style={{ backgroundColor: "#2d8a55", borderColor: "#2d8a55", fontWeight: 700 }}
                    onClick={handleFinalizeGRN}
                  >
                    {createdPurchaseInvoiceId
                      ? "Save GRN & Receive Stock"
                      : "Save Purchase Invoice & GRN"}
                  </Button>
                  <Button block onClick={() => setCurrentStep(1)}>
                    Back to Approved PO
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        <Card
          bordered={false}
          title={<span style={{ color: "#183c35", fontWeight: 700 }}>Purchase invoices awaiting stock receipt</span>}
          style={{ borderRadius: 10, marginTop: 24 }}
        >
          <Table
            rowKey="_id"
            size="small"
            dataSource={pendingPurchaseInvoices}
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: "No purchase invoices are waiting for stock." }}
            columns={[
              {
                title: "Supplier invoice number",
                dataIndex: "invoiceNumber",
                key: "invoiceNumber",
              },
              {
                title: "Supplier",
                dataIndex: "costumerName",
                key: "supplier",
              },
              {
                title: "Invoice total",
                dataIndex: "totalAmount",
                key: "totalAmount",
                align: "right",
                render: (value) => `PKR ${Number(value || 0).toFixed(2)}`,
              },
              {
                title: "Action",
                key: "action",
                align: "right",
                render: (_, invoice) => (
                  <Button
                    size="small"
                    icon={<InboxOutlined />}
                    onClick={() => handleReceiveRemaining(invoice)}
                  >
                    Receive remaining stock
                  </Button>
                ),
              },
            ]}
          />
        </Card>
        <Card
          bordered={false}
          title={<span style={{ color: "#183c35", fontWeight: 700 }}>Goods receipts (GRNs)</span>}
          style={{ borderRadius: 10, marginTop: 16 }}
        >
          <Table
            rowKey="_id"
            size="small"
            dataSource={goodsReceipts}
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: "No goods receipts have been recorded." }}
            columns={[
              {
                title: "GRN number",
                dataIndex: "grnNumber",
                key: "grnNumber",
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (status) => (
                  <Tag color={status === "voided" ? "red" : "green"}>
                    {status === "voided" ? "Voided" : "Completed"}
                  </Tag>
                ),
              },
              {
                title: "Supplier invoice",
                key: "invoiceNumber",
                render: (_, receipt) => receipt.purchaseInvoiceId?.invoiceNumber || "—",
              },
              {
                title: "Date",
                dataIndex: "date",
                key: "date",
                render: (value) => value
                  ? new Date(value).toLocaleDateString("en-PK")
                  : "—",
              },
              {
                title: "Items received",
                key: "items",
                align: "right",
                render: (_, receipt) =>
                  (receipt.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
              },
              {
                title: "Value",
                dataIndex: "totalCost",
                key: "totalCost",
                align: "right",
                render: (value) => `PKR ${Number(value || 0).toFixed(2)}`,
              },
            ]}
          />
        </Card>
      </div>
    </DefaultLayout>
  );
}
