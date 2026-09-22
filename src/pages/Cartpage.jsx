import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  SafetyOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CarOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import DefaultLayout from "../components/Defaultlayouts";
import { useCheckoutMutation, useAccounts } from "../hooks/usePosQueries";
import { useTenantSettings } from "../hooks/useTenantSettings";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import {
  calculateCartSubtotal,
  calculateCartTotal,
  calculateCartUnits,
  calculateLineTotal,
  calculateChangeDue,
  calculateDueDebt,
  formatCurrency,
  handleCheckoutSubmission,
} from "../handlers/cartHandlers";
import { notifyInfo } from "../utils/errorHandler";
import "../styles/Pos.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function Cartpage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.rootReducer);
  const { tenantSettings } = useTenantSettings();
  const checkout = useCheckoutMutation();
  const { data: customerAccounts = [], isLoading: loadingAccounts } = useAccounts({
    accountType: "Customer",
  });

  const [checkoutOpen, setCheckoutOpen] = useState(
    new URLSearchParams(location.search).get("checkout") === "1"
  );
  const [completedBill, setCompletedBill] = useState(null);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [form] = Form.useForm();

  // Pure Client Calculations
  const rawSubtotal = useMemo(() => calculateCartSubtotal(cartItems), [cartItems]);
  const unitsCount = useMemo(() => calculateCartUnits(cartItems), [cartItems]);

  // Watched Modal Form Values
  const watchedFare = Form.useWatch("fare", form) || 0;
  const watchedDiscount = Form.useWatch("totalDiscount", form) || 0;
  const watchedAccountId = Form.useWatch("accountId", form);
  const watchedPaidAmount = Form.useWatch("paidAmount", form);
  const watchedPaymentMethod = Form.useWatch("paymentMethod", form) || "cash";

  const selectedCustomer = useMemo(
    () => customerAccounts.find((c) => String(c._id) === String(watchedAccountId)),
    [customerAccounts, watchedAccountId]
  );

  const finalTotal = useMemo(() => {
    return calculateCartTotal(cartItems, {
      totalDiscount: watchedDiscount,
      fare: watchedFare,
      taxRate: tenantSettings?.taxRate || 0,
      taxStrategy: tenantSettings?.taxStrategy || "zero",
    });
  }, [cartItems, watchedDiscount, watchedFare, tenantSettings]);

  const changeDue = useMemo(
    () => calculateChangeDue(watchedPaidAmount, finalTotal),
    [watchedPaidAmount, finalTotal]
  );
  const dueDebt = useMemo(
    () => calculateDueDebt(watchedPaidAmount, finalTotal),
    [watchedPaidAmount, finalTotal]
  );

  useEffect(() => {
    if (new URLSearchParams(location.search).get("checkout") === "1" && cartItems.length) {
      setCheckoutOpen(true);
    }
  }, [cartItems.length, location.search]);

  const openCheckout = () => {
    if (!cartItems.length) {
      notifyInfo("Add products to the basket before proceeding to checkout.");
      return;
    }
    form.setFieldsValue({
      fare: 0,
      totalDiscount: 0,
      accountId: undefined,
      costumerName: "",
      costumerNumber: "",
      paymentMethod: "cash",
      paidAmount: rawSubtotal,
    });
    setCheckoutOpen(true);
  };

  // Sync paidAmount default when subtotal changes before modal opening
  useEffect(() => {
    if (checkoutOpen && form.getFieldValue("paidAmount") === undefined) {
      form.setFieldValue("paidAmount", finalTotal);
    }
  }, [finalTotal, checkoutOpen, form]);

  const handleCustomerSelect = (accId) => {
    if (!accId) {
      form.setFieldsValue({
        accountId: undefined,
        costumerName: "",
        costumerNumber: "",
      });
      return;
    }
    const acc = customerAccounts.find((c) => String(c._id) === String(accId));
    if (acc) {
      form.setFieldsValue({
        accountId: acc._id,
        costumerName: acc.name,
        costumerNumber: acc.phone || "",
      });
    }
  };

  const submitCheckout = async (values) => {
    await handleCheckoutSubmission({
      checkoutMutation: checkout,
      values,
      cartItems,
      calculated: {
        total: finalTotal,
        subtotal: rawSubtotal,
        fare: watchedFare,
        totalDiscount: watchedDiscount,
      },
      onSuccess: (res) => {
        dispatch({ type: "CLEAR_CART" });
        setCheckoutOpen(false);
        setCompletedBill(res?.data || res);
      },
    });
  };

  const columns = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <Space size={12}>
          {record.image ? (
            <img
              src={record.image}
              alt={record.name}
              style={{
                width: 44,
                height: 44,
                objectFit: "cover",
                borderRadius: 6,
                backgroundColor: "#f4f7f4",
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                backgroundColor: "#e6f2eb",
                color: "#183c35",
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
              }}
            >
              {record.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: "#183c35" }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Stock: {record.stock} | Category: {record.category || "General"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "salePrice",
      key: "salePrice",
      render: (value) => <strong>{formatCurrency(value)}</strong>,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (value, record) => (
        <InputNumber
          min={1}
          max={record.stock}
          value={value}
          onChange={(next) =>
            dispatch({
              type: "UPDATE_CART",
              payload: { ...record, quantity: next || 1 },
            })
          }
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: "Line Total",
      key: "lineTotal",
      render: (_, record) => (
        <strong style={{ color: "#22614e" }}>
          {formatCurrency(calculateLineTotal(record.salePrice, record.quantity, record.unitDiscount))}
        </strong>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => dispatch({ type: "DELETE_FROM_CART", payload: record })}
        />
      ),
    },
  ];

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/")}
              style={{ fontWeight: 600, color: "#183c35" }}
            >
              Back to POS Catalog
            </Button>
            {cartItems.length > 0 && (
              <Button
                type="text"
                danger
                icon={<ClearOutlined />}
                onClick={() => dispatch({ type: "CLEAR_CART" })}
              >
                Clear Entire Basket
              </Button>
            )}
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card
                bordered={false}
                style={{
                  boxShadow: "0 4px 16px rgba(24,60,53,0.05)",
                  borderRadius: 12,
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ margin: 0, color: "#183c35" }}>
                    Sale Items ({cartItems.length})
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Review selected products and verify quantities before issuing receipt.
                  </Text>
                </div>

                <Table
                  rowKey="_id"
                  columns={columns}
                  dataSource={cartItems}
                  pagination={false}
                  locale={{
                    emptyText: (
                      <Empty
                        description="Your basket is currently empty"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button type="primary" onClick={() => navigate("/")}>
                          Return to Catalog
                        </Button>
                      </Empty>
                    ),
                  }}
                />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                bordered={false}
                style={{
                  boxShadow: "0 4px 16px rgba(24,60,53,0.05)",
                  borderRadius: 12,
                  background: "#ffffff",
                }}
              >
                <Title level={4} style={{ color: "#183c35", marginTop: 0 }}>
                  Order Summary
                </Title>

                <div style={{ margin: "20px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      alignItems: "center",
                      color: "#183c35",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Total Items / Units</span>
                    <span
                      style={{
                        backgroundColor: "#e6f9ed",
                        color: "#0d6832",
                        border: "1px solid #7be4a3",
                        fontWeight: 800,
                        padding: "2px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    >
                      {unitsCount} units
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      color: "#666",
                    }}
                  >
                    <span>Items Subtotal</span>
                    <strong>{formatCurrency(rawSubtotal)}</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "16px 0 8px",
                      borderTop: "2px solid #eef3ef",
                      marginTop: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#183c35" }}>
                      Estimated Total
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#183c35" }}>
                      {formatCurrency(rawSubtotal)}
                    </span>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ShoppingCartOutlined />}
                  disabled={!cartItems.length}
                  onClick={openCheckout}
                  style={{
                    backgroundColor: "#f2c14e",
                    color: "#183c35",
                    borderColor: "#f2c14e",
                    fontWeight: 800,
                    height: 50,
                    fontSize: 16,
                  }}
                >
                  Proceed to Checkout
                </Button>
              </Card>
            </Col>
          </Row>
        </Space>

        {/* Checkout Modal */}
        <Modal
          centered
          open={checkoutOpen}
          title={
            <Space>
              <SafetyOutlined style={{ color: "#2d8a55" }} />
              <span style={{ fontWeight: 700, color: "#183c35" }}>
                Complete Sale & Generate Receipt
              </span>
            </Space>
          }
          onCancel={() => setCheckoutOpen(false)}
          okText="Confirm Transaction"
          confirmLoading={checkout.isPending}
          onOk={() => form.submit()}
          destroyOnClose
          width={540}
          styles={{
            body: {
              maxHeight: "calc(100vh - 160px)",
              overflowY: "auto",
              paddingRight: 8,
            },
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={submitCheckout}
            initialValues={{
              paymentMethod: "cash",
              fare: 0,
              totalDiscount: 0,
              paidAmount: rawSubtotal,
            }}
          >
            {/* Live Financial Summary Header */}
            <div
              style={{
                background: "#183c35",
                color: "#ffffff",
                padding: "14px 18px",
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, opacity: 0.9 }}>Grand Total Payable</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#f2c14e" }}>
                  {formatCurrency(finalTotal)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginTop: 6,
                  opacity: 0.8,
                  borderTop: "1px solid rgba(255,255,255,0.15)",
                  paddingTop: 6,
                }}
              >
                <span>Subtotal: {formatCurrency(rawSubtotal)}</span>
                {watchedDiscount > 0 && <span>Disc: -{formatCurrency(watchedDiscount)}</span>}
                {watchedFare > 0 && <span>Fare: +{formatCurrency(watchedFare)}</span>}
              </div>
            </div>

            {/* Customer Account / Khata Ledger Selector */}
            <Form.Item label="Customer / Khata Account" style={{ marginBottom: 12 }}>
              <Form.Item name="accountId" noStyle>
                <Select
                  showSearch
                  placeholder="Select registered customer or walk-in"
                  loading={loadingAccounts}
                  onChange={handleCustomerSelect}
                  allowClear
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { value: "", label: "🚶 Walk-in Customer (Non-Account)" },
                    ...customerAccounts.map((c) => ({
                      value: c._id,
                      label: `${c.name} (${c.accountCode || "CUST"}) - ${c.phone || "No Phone"}`,
                    })),
                  ]}
                />
              </Form.Item>
            </Form.Item>

            {/* Selected Customer Khata Info Badge */}
            {selectedCustomer && (
              <div
                style={{
                  background: "#f6ffed",
                  border: "1px solid #b7eb8f",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ color: "#183c35" }}>
                      <UserOutlined style={{ marginRight: 6 }} />
                      {selectedCustomer.name}
                    </Text>
                    <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>
                      [{selectedCustomer.accountCode}]
                    </span>
                  </div>
                  <Tag color={selectedCustomer.currentBalance > 0 ? "volcano" : "green"}>
                    {selectedCustomer.currentBalance > 0
                      ? `Receivable Debt: ${formatCurrency(selectedCustomer.currentBalance)}`
                      : "No Debt Outstanding"}
                  </Tag>
                </div>
              </div>
            )}

            {/* Customer Details Inputs for Walk-in or custom overrides */}
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="costumerName" label="Customer Name">
                  <Input placeholder="Walk-in Customer" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="costumerNumber" label="Customer Phone">
                  <Input placeholder="03XXXXXXXXX" />
                </Form.Item>
              </Col>
            </Row>

            {/* Freight/Delivery Fare and Bill Discount */}
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="fare" label="Transport / Delivery Fare">
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: "100%" }}
                    prefix={<CarOutlined style={{ color: "#888" }} />}
                    placeholder="PKR 0.00"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="totalDiscount" label="Bill-Level Discount">
                  <InputNumber
                    min={0}
                    precision={2}
                    style={{ width: "100%" }}
                    prefix={<PercentageOutlined style={{ color: "#888" }} />}
                    placeholder="PKR 0.00"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Payment Method Selector */}
            <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                style={{ width: "100%", display: "flex" }}
              >
                <Radio.Button value="cash" style={{ flex: 1, textAlign: "center" }}>
                  <DollarOutlined /> Cash
                </Radio.Button>
                <Radio.Button value="card" style={{ flex: 1, textAlign: "center" }}>
                  <CreditCardOutlined /> Card
                </Radio.Button>
                <Radio.Button
                  value="borrow"
                  style={{ flex: 1, textAlign: "center", fontWeight: 600 }}
                >
                  Khata (Credit)
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            {/* Cash Tendered Input */}
            <Form.Item
              name="paidAmount"
              label="Amount Tendered / Received"
              rules={[
                { required: true, message: "Enter amount received" },
                {
                  validator: (_, value) =>
                    watchedPaymentMethod === "borrow" || Number(value) >= finalTotal
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(
                            "Tendered amount must cover total, or switch payment method to Khata (Credit)"
                          )
                        ),
                },
              ]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: "100%" }}
                size="large"
                placeholder="Enter tendered amount"
              />
            </Form.Item>

            {/* Quick Tender Shortcuts */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              <Button size="small" onClick={() => form.setFieldValue("paidAmount", finalTotal)}>
                Exact Amount
              </Button>
              <Button
                size="small"
                onClick={() =>
                  form.setFieldValue("paidAmount", Math.ceil(finalTotal / 100) * 100 || finalTotal)
                }
              >
                Round 100s
              </Button>
              <Button
                size="small"
                onClick={() =>
                  form.setFieldValue("paidAmount", Math.ceil(finalTotal / 500) * 500 || finalTotal)
                }
              >
                Round 500s
              </Button>
              {watchedPaymentMethod === "borrow" && (
                <Button size="small" danger onClick={() => form.setFieldValue("paidAmount", 0)}>
                  Zero Cash (100% Debt)
                </Button>
              )}
            </div>

            {/* Financial Change or Khata Debt Footer Tag */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "#f9faf9",
                borderRadius: 8,
                border: "1px solid #e2e8e3",
              }}
            >
              {Number(watchedPaidAmount || 0) >= finalTotal ? (
                <>
                  <span style={{ fontWeight: 600, color: "#183c35" }}>Cash Change Due:</span>
                  <Tag color="success" style={{ fontSize: 15, padding: "4px 12px", fontWeight: 700 }}>
                    {formatCurrency(changeDue)}
                  </Tag>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 600, color: "#cf1322" }}>
                    Debt to Khata (Borrow):
                  </span>
                  <Tag color="volcano" style={{ fontSize: 15, padding: "4px 12px", fontWeight: 700 }}>
                    {formatCurrency(dueDebt)}
                  </Tag>
                </>
              )}
            </div>

            {/* Estimated New Balance Note for Selected Customer */}
            {selectedCustomer && dueDebt > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 12, fontSize: 12 }}
                message={
                  <span>
                    New estimated balance for <strong>{selectedCustomer.name}</strong> will be{" "}
                    <strong>
                      {formatCurrency(
                        (Number(selectedCustomer.currentBalance) || 0) + dueDebt
                      )}
                    </strong>
                  </span>
                }
              />
            )}
          </Form>
        </Modal>

        {/* Sale Success Modal */}
        <Modal
          centered
          title={
            <Tag color="success" style={{ fontSize: 14, padding: "4px 10px" }}>
              <CheckCircleOutlined /> Transaction Successful
            </Tag>
          }
          open={Boolean(completedBill)}
          onCancel={() => {
            setCompletedBill(null);
            navigate("/bills");
          }}
          footer={[
            <Button
              key="new"
              onClick={() => {
                setCompletedBill(null);
                navigate("/");
              }}
            >
              New Sale
            </Button>,
            <Button
              key="invoice"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setInvoiceVisible(true)}
              style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
            >
              Show Invoice
            </Button>,
          ]}
        >
          <Paragraph>The sale has been committed to inventory records.</Paragraph>
          <Card size="small" style={{ backgroundColor: "#f8faf8", borderColor: "#dfe8e1" }}>
            <p>
              <strong>Invoice ID:</strong> {completedBill?._id}
            </p>
            {completedBill?.invoiceNumber && (
              <p>
                <strong>Invoice #:</strong> {completedBill?.invoiceNumber}
              </p>
            )}
            <p>
              <strong>Total Amount:</strong> {formatCurrency(completedBill?.totalAmount)}
            </p>
            <p>
              <strong>Paid Amount:</strong> {formatCurrency(completedBill?.paidAmount)}
            </p>
            {completedBill?.dueAmount > 0 && (
              <p>
                <strong>Khata Debt:</strong>{" "}
                <Tag color="volcano">{formatCurrency(completedBill?.dueAmount)}</Tag>
              </p>
            )}
            <p>
              <strong>Payment Mode:</strong> <Tag color="blue">{completedBill?.paymentMethod}</Tag>
            </p>
            <p>
              <strong>Items:</strong> {completedBill?.cartItems?.length} products
            </p>
          </Card>
        </Modal>

        {/* Shared Invoice Preview Modal */}
        <InvoicePreviewModal
          open={invoiceVisible}
          onClose={() => {
            setInvoiceVisible(false);
            setCompletedBill(null);
          }}
          bill={completedBill || {}}
          tenant={tenantSettings}
          defaultTemplate={tenantSettings?.receiptTemplate || "thermal80mm"}
        />
      </div>
    </DefaultLayout>
  );
}