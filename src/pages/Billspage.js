import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import DefaultLayout from "../components/Defaultlayouts";
import { useBillMutations, useBills } from "../hooks/usePosQueries";
import {
  calculateBillStats,
  filterBills,
  formatBillDate,
  formatCurrency,
  handleUpdateBill,
  handleDeleteBill,
} from "../handlers/billsHandlers";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Billspage() {
  const { data: billsData = [], isLoading, isError, refetch } = useBills();
  const { editBill, deleteBill } = useBillMutations();

  const [selectedBill, setSelectedBill] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const printableReceiptRef = useRef(null);

  // Statistics
  const stats = useMemo(() => calculateBillStats(billsData), [billsData]);

  // Filter bills
  const filteredBills = useMemo(
    () => filterBills(billsData, searchQuery, paymentFilter),
    [billsData, searchQuery, paymentFilter]
  );

  // Presentation action handlers (delegated to pure handlers with centralized error handling)
  const onEditBillSubmit = async (values) => {
    await handleUpdateBill({
      editBillMutation: editBill,
      selectedBill,
      values,
      onSuccess: () => {
        setEditModalVisible(false);
        setSelectedBill(null);
      },
    });
  };

  const onDeleteBillConfirm = async (billId) => {
    await handleDeleteBill({
      deleteBillMutation: deleteBill,
      billId,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: "Invoice #",
      dataIndex: "_id",
      key: "_id",
      render: (id) => (
        <Text code copyable>
          {id ? id.slice(-8).toUpperCase() : "—"}
        </Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => formatBillDate(date),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "#183c35" }}>
            {record.costumerName || "Walk-in Customer"}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.costumerNumber || "No contact"}
          </Text>
        </div>
      ),
    },
    {
      title: "Payment Mode",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => {
        const color =
          method === "cash" ? "green" : method === "card" ? "blue" : "orange";
        return (
          <Tag color={color} style={{ textTransform: "capitalize" }}>
            {method || "cash"}
          </Tag>
        );
      },
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => <strong>{formatCurrency(amount)}</strong>,
    },
    {
      title: "Paid Amount",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (paid, record) => {
        const total = Number(record.totalAmount || 0);
        const isFull = Number(paid) >= total;
        return (
          <Tag color={isFull ? "success" : "warning"}>
            {formatCurrency(paid)}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View & Print Receipt">
            <Button
              size="small"
              icon={<EyeOutlined style={{ color: "#183c35" }} />}
              onClick={() => {
                setSelectedBill(record);
                setViewModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Details">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedBill(record);
                form.setFieldsValue({
                  costumerName: record.costumerName,
                  costumerNumber: record.costumerNumber,
                  paymentMethod: record.paymentMethod,
                  totalAmount: record.totalAmount,
                  paidAmount: record.paidAmount,
                });
                setEditModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Invoice?"
            description="Are you sure you want to delete this invoice record?"
            onConfirm={() => onDeleteBillConfirm(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DefaultLayout>
      {/* Scoped print styles optimized for 80mm thermal receipt roll printers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible !important;
          }
          .printable-receipt {
            position: absolute !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 4px !important;
            background: #fff !important;
          }
          .ant-modal-footer,
          .ant-modal-close,
          .ant-modal-header {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
        {/* Page Heading */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8b9991",
                fontWeight: 700,
              }}
            >
              Sales & Invoicing
            </span>
            <Title level={2} style={{ margin: "2px 0 0", color: "#183c35" }}>
              Invoices & Transaction Logs
            </Title>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh Invoices
          </Button>
        </div>

        {/* Revenue KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 2px 12px rgba(24,60,53,0.04)",
                borderRadius: 10,
              }}
            >
              <Statistic
                title="Total Invoices"
                value={stats.count}
                prefix={<FileTextOutlined style={{ color: "#183c35" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 2px 12px rgba(24,60,53,0.04)",
                borderRadius: 10,
              }}
            >
              <Statistic
                title="Total Billed"
                value={formatCurrency(stats.totalRevenue)}
                prefix={<DollarOutlined style={{ color: "#2d8a55" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 2px 12px rgba(24,60,53,0.04)",
                borderRadius: 10,
              }}
            >
              <Statistic
                title="Collected Revenue"
                value={formatCurrency(stats.totalCollected)}
                valueStyle={{ color: "#2d8a55" }}
                prefix={<CreditCardOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 2px 12px rgba(24,60,53,0.04)",
                borderRadius: 10,
              }}
            >
              <Statistic
                title="Receivable Balance"
                value={formatCurrency(stats.totalReceivable)}
                valueStyle={{
                  color: stats.totalReceivable > 0 ? "#cf1322" : "#8c8c8c",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Search & Filter Bar */}
        <Card
          bordered={false}
          style={{
            boxShadow: "0 4px 16px rgba(24,60,53,0.05)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <Input
              placeholder="Search by customer name, phone, or invoice ID..."
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ maxWidth: 380 }}
            />
            <Space>
              <Text style={{ fontSize: 13, color: "#666" }}>
                Filter Method:
              </Text>
              <Select
                value={paymentFilter}
                onChange={setPaymentFilter}
                style={{ width: 130 }}
              >
                <Option value="all">All Modes</Option>
                <Option value="cash">Cash</Option>
                <Option value="card">Card</Option>
                <Option value="borrow">Borrow/Credit</Option>
              </Select>
            </Space>
          </div>

          {isError && (
            <Alert
              type="error"
              showIcon
              message="Failed to load invoices"
              action={
                <Button size="small" onClick={() => refetch()}>
                  Retry
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            columns={columns}
            dataSource={filteredBills}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{
              emptyText: (
                <Empty description="No invoices found matching query" />
              ),
            }}
          />
        </Card>

        {/* Edit Bill Modal */}
        {editModalVisible && selectedBill && (
          <Modal
            title="Edit Invoice Information"
            open={editModalVisible}
            onCancel={() => {
              setEditModalVisible(false);
              setSelectedBill(null);
            }}
            footer={null}
            destroyOnClose
          >
            <Form form={form} layout="vertical" onFinish={onEditBillSubmit}>
              <Form.Item
                name="costumerName"
                label="Customer Name"
                rules={[
                  { required: true, message: "Please enter customer name" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="costumerNumber"
                label="Customer Phone"
                rules={[
                  { required: true, message: "Please enter customer phone" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="cash">Cash</Option>
                  <Option value="card">Card</Option>
                  <Option value="borrow">Borrow / Credit</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="totalAmount"
                label="Total Amount"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="paidAmount"
                label="Paid Amount"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                <Button onClick={() => setEditModalVisible(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={editBill.isPending}
                  style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          </Modal>
        )}

        {/* View & Print Thermal Receipt Modal */}
        {viewModalVisible && selectedBill && (
          <Modal
            title="Customer Receipt"
            open={viewModalVisible}
            onCancel={() => {
              setViewModalVisible(false);
              setSelectedBill(null);
            }}
            footer={[
              <Button key="close" onClick={() => setViewModalVisible(false)}>
                Close
              </Button>,
              <Button
                key="print"
                type="primary"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
              >
                Print Receipt
              </Button>,
            ]}
            width={420}
          >
            <div
              ref={printableReceiptRef}
              className="printable-receipt"
              style={{
                textAlign: "center",
                padding: "16px 8px",
                fontFamily: "monospace",
                color: "#000",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>
                HARDWARE POINT
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                Main Retail Terminal, Branch 01
              </div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>
                Phone: +92 (300) 000-0000
              </div>

              <div
                style={{
                  borderBottom: "1px dashed #444",
                  paddingBottom: 8,
                  marginBottom: 8,
                  textAlign: "left",
                  fontSize: 12,
                }}
              >
                <div>
                  <strong>Invoice #:</strong> {selectedBill._id}
                </div>
                <div>
                  <strong>Date:</strong> {formatBillDate(selectedBill.date)}
                </div>
                <div>
                  <strong>Customer:</strong>{" "}
                  {selectedBill.costumerName || "Walk-in"}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedBill.costumerNumber || "—"}
                </div>
                <div>
                  <strong>Payment:</strong>{" "}
                  {selectedBill.paymentMethod?.toUpperCase()}
                </div>
              </div>

              <div style={{ textAlign: "left", marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    borderBottom: "1px solid #444",
                    paddingBottom: 4,
                  }}
                >
                  <span>Item</span>
                  <span>Qty × Price</span>
                  <span>Total</span>
                </div>
                {selectedBill.cartItems?.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      padding: "4px 0",
                    }}
                  >
                    <span
                      style={{
                        maxWidth: 140,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </span>
                    <span>
                      {item.quantity} × {Number(item.salePrice).toFixed(0)}
                    </span>
                    <strong>
                      PKR {(item.quantity * item.salePrice).toFixed(0)}
                    </strong>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderTop: "1px dashed #444",
                  paddingTop: 8,
                  textAlign: "right",
                  fontSize: 13,
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Total Amount:</span>
                  <strong>
                    PKR {Number(selectedBill.totalAmount).toFixed(2)}
                  </strong>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Amount Paid:</span>
                  <span>PKR {Number(selectedBill.paidAmount).toFixed(2)}</span>
                </div>
                {Number(selectedBill.paidAmount) <
                  Number(selectedBill.totalAmount) && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#cf1322",
                      fontWeight: 700,
                    }}
                  >
                    <span>Balance Due:</span>
                    <span>
                      PKR{" "}
                      {(
                        Number(selectedBill.totalAmount) -
                        Number(selectedBill.paidAmount)
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 20,
                  fontSize: 11,
                  color: "#666",
                  textAlign: "center",
                }}
              >
                *** Thank You for Your Business! ***
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DefaultLayout>
  );
}