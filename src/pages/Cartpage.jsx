import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
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
  PrinterOutlined,
  SafetyOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import DefaultLayout from "../components/Defaultlayouts";
import { useCheckoutMutation } from "../hooks/usePosQueries";
import {
  calculateCartTotal,
  calculateCartUnits,
  calculateLineTotal,
  calculateChangeDue,
  formatCurrency,
  handleCheckoutSubmission,
} from "../handlers/cartHandlers";
import { notifyInfo } from "../utils/errorHandler";
import "../styles/Pos.css";

const { Title, Text, Paragraph } = Typography;

export default function Cartpage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.rootReducer);
  const checkout = useCheckoutMutation();

  const [checkoutOpen, setCheckoutOpen] = useState(
    new URLSearchParams(location.search).get("checkout") === "1"
  );
  const [completedBill, setCompletedBill] = useState(null);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [form] = Form.useForm();

  // Pure decoupled calculations
  const total = useMemo(() => calculateCartTotal(cartItems), [cartItems]);
  const unitsCount = useMemo(() => calculateCartUnits(cartItems), [cartItems]);
  const paidAmount = Form.useWatch("paidAmount", form) || 0;
  const paymentMethod = Form.useWatch("paymentMethod", form);

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
      paidAmount: total,
      paymentMethod: "cash",
      costumerName: "",
      costumerNumber: "",
    });
    setCheckoutOpen(true);
  };

  const submitCheckout = async (values) => {
    await handleCheckoutSubmission({
      checkoutMutation: checkout,
      values,
      cartItems,
      total,
      onSuccess: (res) => {
        dispatch({ type: "CLEAR_CART" });
        setCheckoutOpen(false);
        setCompletedBill(res?.data || res);
      },
    });
  };

  const handlePrintInvoice = () => {
    window.print();
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
          {formatCurrency(calculateLineTotal(record.salePrice, record.quantity))}
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
            {/* Cart Items Table */}
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

            {/* Summary & Checkout Actions */}
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
                      color: "#666",
                    }}
                  >
                    <span>Items Count</span>
                    <strong>{unitsCount} units</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      color: "#666",
                    }}
                  >
                    <span>Subtotal</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      color: "#666",
                    }}
                  >
                    <span>Tax / GST (0%)</span>
                    <strong>PKR 0.00</strong>
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
                      Final Amount
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#183c35" }}>
                      {formatCurrency(total)}
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
          open={checkoutOpen}
          title={
            <Space>
              <SafetyOutlined style={{ color: "#2d8a55" }} />
              <span>Complete Sale & Generate Receipt</span>
            </Space>
          }
          onCancel={() => setCheckoutOpen(false)}
          okText="Confirm Transaction"
          confirmLoading={checkout.isPending}
          onOk={() => form.submit()}
          destroyOnClose
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={submitCheckout}
            initialValues={{ paymentMethod: "cash", paidAmount: total }}
          >
            <div className="checkout-total-card">
              <span>Amount Due</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
              <Radio.Group optionType="button" buttonStyle="solid" style={{ width: "100%", display: "flex" }}>
                <Radio.Button value="cash" style={{ flex: 1, textAlign: "center" }}>
                  <DollarOutlined /> Cash
                </Radio.Button>
                <Radio.Button value="card" style={{ flex: 1, textAlign: "center" }}>
                  <CreditCardOutlined /> Card
                </Radio.Button>
                <Radio.Button value="borrow" style={{ flex: 1, textAlign: "center" }}>
                  Credit / Borrow
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="costumerName" label="Customer Name (Optional)">
                  <Input placeholder="e.g. Ali" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="costumerNumber" label="Customer Phone (Optional)">
                  <Input placeholder="e.g. 03001234567" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="paidAmount"
              label="Cash Tendered (Received)"
              rules={[
                { required: true, message: "Enter the amount received" },
                {
                  validator: (_, value) =>
                    paymentMethod === "borrow" || Number(value) >= total
                      ? Promise.resolve()
                      : Promise.reject(new Error("Amount received must cover total amount")),
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

            <div className="checkout-change-row">
              <span>Change Due:</span>
              <Tag
                color={Number(paidAmount) >= total ? "success" : "warning"}
                style={{ fontSize: 14, padding: "4px 10px" }}
              >
                {formatCurrency(calculateChangeDue(paidAmount, total))}
              </Tag>
            </div>
          </Form>
        </Modal>

        {/* Sale Success Modal with Invoice details */}
        <Modal
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
            <Button key="new" onClick={() => { setCompletedBill(null); navigate("/"); }}>
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
            <p><strong>Invoice ID:</strong> {completedBill?._id}</p>
            <p><strong>Total Amount:</strong> {formatCurrency(completedBill?.totalAmount)}</p>
            <p><strong>Payment Mode:</strong> <Tag color="blue">{completedBill?.paymentMethod}</Tag></p>
            <p><strong>Items:</strong> {completedBill?.cartItems?.length} products</p>
          </Card>
        </Modal>

        <Modal
          title="Invoice Preview"
          open={invoiceVisible}
          onCancel={() => setInvoiceVisible(false)}
          width={420}
          footer={[
            <Button key="skip" onClick={() => setInvoiceVisible(false)}>
              Do Not Print
            </Button>,
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrintInvoice}
              style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
            >
              Print Invoice
            </Button>,
          ]}
        >
          <div className="checkout-invoice-preview">
            <div className="checkout-invoice-brand">HARDWARE POINT</div>
            <div className="checkout-invoice-subtitle">Main Retail Terminal, Branch 01</div>
            <div className="checkout-invoice-rule" />
            <div className="checkout-invoice-meta">
              <div><strong>Invoice #:</strong> {completedBill?._id || "—"}</div>
              <div><strong>Date:</strong> {completedBill?.date ? new Date(completedBill.date).toLocaleString() : "—"}</div>
              <div><strong>Customer:</strong> {completedBill?.costumerName || "Walk-in"}</div>
              <div><strong>Payment:</strong> {completedBill?.paymentMethod?.toUpperCase() || "—"}</div>
            </div>
            <div className="checkout-invoice-items">
              {completedBill?.cartItems?.map((item) => (
                <div className="checkout-invoice-item" key={item._id}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{formatCurrency(Number(item.salePrice) * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="checkout-invoice-total">
              <span>Total</span>
              <strong>{formatCurrency(completedBill?.totalAmount)}</strong>
            </div>
          </div>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
