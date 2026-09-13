import React, { useMemo, useState } from "react";
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
  message,
} from "antd";
import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import DefaultLayout from "../components/Defaultlayouts";
import { useBillMutations, useBills } from "../hooks/usePosQueries";
import usePermission from "../hooks/usePermission";
import { useTenantSettings } from "../hooks/useTenantSettings";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import AuditTrailDrawer from "../components/AuditTrailDrawer";
import apiClient from "../api/client";
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
  const { can } = usePermission();
  const { tenantSettings } = useTenantSettings();
  const { data: billsData = [], isLoading, isError, refetch } = useBills();
  const { editBill, deleteBill } = useBillMutations();

  const [selectedBill, setSelectedBill] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  // Statistics
  const stats = useMemo(() => calculateBillStats(billsData), [billsData]);

  // Combined search, payment mode, and invoice status filter
  const filteredBills = useMemo(() => {
    let result = filterBills(billsData, searchQuery, paymentFilter);

    if (statusFilter !== "all") {
      result = result.filter((bill) => {
        const isVoid = bill.status === "voided";
        const total = Number(bill.totalAmount || 0);
        const paid = Number(bill.paidAmount || 0);
        const isFull = paid >= total;

        if (statusFilter === "voided") return isVoid;
        if (statusFilter === "completed") return !isVoid && isFull;
        if (statusFilter === "receivable") return !isVoid && !isFull;
        return true;
      });
    }

    return result;
  }, [billsData, searchQuery, paymentFilter, statusFilter]);

  // Action Handlers
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

  const onVoidBillConfirm = async (billId) => {
    try {
      await apiClient.post(`/bill/void-bill/${billId}`);
      message.success("Invoice voided successfully and inventory stock restored!");
      refetch();
    } catch (err) {
      message.error(err.response?.data?.error || "Failed to void invoice");
    }
  };

  const columns = [
    {
      title: "Invoice #",
      dataIndex: "_id",
      key: "_id",
      render: (id, record) => (
        <Space direction="vertical" size={2}>
          <Text code copyable style={{ fontWeight: 700, color: "#183c35" }}>
            {id ? (String(id).startsWith("OFFLINE-") ? id.slice(-8).toUpperCase() : id.slice(-8).toUpperCase()) : "—"}
          </Text>
          {record.isOffline && record.syncStatus === "pending" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
                backgroundColor: "#fff8e6",
                border: "1px solid #ffd57e",
                color: "#925400",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 9 }} /> Pending Sync
            </span>
          )}
          {record.isOffline && record.syncStatus === "synced" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
                backgroundColor: "#e6f9ed",
                border: "1px solid #7be4a3",
                color: "#0d6832",
              }}
            >
              <CheckCircleOutlined style={{ fontSize: 9 }} /> Synced
            </span>
          )}
        </Space>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => (
        <Text style={{ fontSize: 13, color: "#475467", fontWeight: 500 }}>
          {formatBillDate(date)}
        </Text>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "#183c35" }}>
            {record.costumerName || "Walk-in Customer"}
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.costumerNumber || "No contact info"}
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const isVoid = status === "voided";
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 11,
              padding: "2px 10px",
              border: isVoid ? "1px solid #fca5a5" : "1px solid #7be4a3",
              backgroundColor: isVoid ? "#fee2e2" : "#e6f9ed",
              color: isVoid ? "#991b1b" : "#0d6832",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: isVoid ? "#cf1322" : "#059669",
              }}
            />
            {(status || "completed").toUpperCase()}
          </span>
        );
      },
    },
    {
      title: "Payment Mode",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => {
        const m = (method || "cash").toLowerCase();
        const isCash = m === "cash";
        const isCard = m === "card";

        return (
          <Tag
            color={isCash ? "green" : isCard ? "blue" : "warning"}
            style={{
              borderRadius: 6,
              fontWeight: 600,
              textTransform: "capitalize",
              fontSize: 11,
              padding: "2px 8px",
            }}
          >
            {m === "borrow" ? "Borrow / Credit" : m}
          </Tag>
        );
      },
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => (
        <strong style={{ color: "#183c35", fontSize: 13 }}>
          {formatCurrency(amount)}
        </strong>
      ),
    },
    {
      title: "Paid Amount",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (paid, record) => {
        const total = Number(record.totalAmount || 0);
        const paidVal = Number(paid || 0);
        const isFull = paidVal >= total;
        const isPartial = paidVal > 0 && paidVal < total;

        return (
          <span
            style={{
              display: "inline-block",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 11,
              padding: "2px 8px",
              border: isFull
                ? "1px solid #7be4a3"
                : isPartial
                ? "1px solid #ffd57e"
                : "1px solid #fca5a5",
              backgroundColor: isFull
                ? "#e6f9ed"
                : isPartial
                ? "#fff8e6"
                : "#fee2e2",
              color: isFull ? "#0d6832" : isPartial ? "#925400" : "#991b1b",
            }}
          >
            {formatCurrency(paidVal)}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size={8} align="center">
          <Tooltip title="View & Print Invoice">
            <Button
              size="small"
              icon={<EyeOutlined style={{ color: "#183c35" }} />}
              onClick={() => {
                setSelectedBill(record);
                setViewModalVisible(true);
              }}
            />
          </Tooltip>
          {can("bills:edit") && record.status !== "voided" && (
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
          )}
          {can("bills:void") && record.status !== "voided" && (
            <Popconfirm
              title="Void this invoice?"
              description="Restores products back to stock and marks invoice as voided."
              onConfirm={() => onVoidBillConfirm(record._id)}
              okText="Void Invoice"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Void Transaction">
                <Button size="small" icon={<StopOutlined style={{ color: "#cf1322" }} />} />
              </Tooltip>
            </Popconfirm>
          )}
          {can("bills:delete") && (
            <Popconfirm
              title="Delete Invoice Record?"
              description="Are you sure you want to permanently remove this transaction record?"
              onConfirm={() => onDeleteBillConfirm(record._id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete Record">
                <Button size="small" icon={<DeleteOutlined style={{ color: "#cf1322" }} />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
        {/* Page Header */}
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
          <Space align="center">
            {can("bills:void") && (
              <Button
                icon={<AuditOutlined />}
                onClick={() => setAuditDrawerOpen(true)}
                style={{ borderColor: "#183c35", color: "#183c35", fontWeight: 600 }}
              >
                Audit Trail
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh Invoices
            </Button>
          </Space>
        </div>

        {/* Revenue KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              onClick={() => setStatusFilter("all")}
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: "3px solid #183c35",
                background: statusFilter === "all" ? "#fbfdfc" : "#ffffff",
                cursor: "pointer",
              }}
            >
              <Statistic
                title={
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#183c35",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Total Invoices
                  </span>
                }
                value={stats.count}
                valueStyle={{ color: "#183c35", fontWeight: 800, fontSize: 26 }}
                prefix={<FileTextOutlined style={{ color: "#183c35", marginRight: 4 }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: "3px solid #2d8a55",
                background: "#ffffff",
              }}
            >
              <Statistic
                title={
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0d6832",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Total Billed
                  </span>
                }
                value={formatCurrency(stats.totalRevenue)}
                valueStyle={{ color: "#0d6832", fontWeight: 800, fontSize: 22 }}
                prefix={<DollarOutlined style={{ color: "#2d8a55", marginRight: 4 }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              onClick={() =>
                setStatusFilter(statusFilter === "completed" ? "all" : "completed")
              }
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: "3px solid #0f766e",
                background: statusFilter === "completed" ? "#f2fcfb" : "#ffffff",
                cursor: "pointer",
              }}
            >
              <Statistic
                title={
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f766e",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Collected Revenue
                  </span>
                }
                value={formatCurrency(stats.totalCollected)}
                valueStyle={{ color: "#0f766e", fontWeight: 800, fontSize: 22 }}
                prefix={<CreditCardOutlined style={{ color: "#0f766e", marginRight: 4 }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              onClick={() =>
                setStatusFilter(statusFilter === "receivable" ? "all" : "receivable")
              }
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: `3px solid ${
                  stats.totalReceivable > 0 ? "#cf1322" : "#8c8c8c"
                }`,
                background: statusFilter === "receivable" ? "#fffdf5" : "#ffffff",
                cursor: "pointer",
              }}
            >
              <Statistic
                title={
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: stats.totalReceivable > 0 ? "#b45309" : "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Receivable Balance
                  </span>
                }
                value={formatCurrency(stats.totalReceivable)}
                valueStyle={{
                  color: stats.totalReceivable > 0 ? "#cf1322" : "#8c8c8c",
                  fontWeight: 800,
                  fontSize: 22,
                }}
                prefix={
                  <WarningOutlined
                    style={{
                      color: stats.totalReceivable > 0 ? "#cf1322" : "#8c8c8c",
                      marginRight: 4,
                    }}
                  />
                }
              />
            </Card>
          </Col>
        </Row>

        {/* Search & Multi-Filter Controls */}
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
              justify: "space-between",
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
              style={{ maxWidth: 360 }}
            />
            <Space wrap align="center">
              {/* Payment Mode Filter */}
              <Space align="center">
                <Text style={{ fontSize: 13, color: "#666" }}>Payment Mode:</Text>
                <Select
                  value={paymentFilter}
                  onChange={setPaymentFilter}
                  style={{ width: 140 }}
                >
                  <Option value="all">All Modes</Option>
                  <Option value="cash">Cash</Option>
                  <Option value="card">Card</Option>
                  <Option value="borrow">Borrow / Credit</Option>
                </Select>
              </Space>

              {/* Status Filter */}
              <Space align="center">
                <Text style={{ fontSize: 13, color: "#666" }}>Invoice Status:</Text>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 150 }}
                >
                  <Option value="all">All Statuses</Option>
                  <Option value="completed">Fully Paid</Option>
                  <Option value="receivable">Pending / Credit</Option>
                  <Option value="voided">Voided Invoices</Option>
                </Select>
              </Space>
            </Space>
          </div>

          {isError && (
            <Alert
              type="error"
              showIcon
              message="Failed to load invoices catalog"
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
                <Empty description="No invoices found matching current filters" />
              ),
            }}
          />
        </Card>

        {/* Edit Bill Details Modal */}
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
                <Input placeholder="Walk-in Customer" />
              </Form.Item>

              <Form.Item
                name="costumerNumber"
                label="Customer Phone"
                rules={[
                  { required: true, message: "Please enter customer phone" },
                ]}
              >
                <Input placeholder="03xx-xxxxxxx" />
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

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="totalAmount"
                    label="Total Amount (PKR)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="paidAmount"
                    label="Paid Amount (PKR)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

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

        {/* Invoice Preview Modal */}
        <InvoicePreviewModal
          open={viewModalVisible}
          onClose={() => {
            setViewModalVisible(false);
            setSelectedBill(null);
          }}
          bill={selectedBill || {}}
          tenant={tenantSettings}
          defaultTemplate={tenantSettings?.receiptTemplate || "thermal80mm"}
        />

        {/* Audit Trail Drawer */}
        <AuditTrailDrawer
          open={auditDrawerOpen}
          onClose={() => setAuditDrawerOpen(false)}
        />
      </div>
    </DefaultLayout>
  );
}