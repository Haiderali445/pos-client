import React, { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DollarOutlined,
  HistoryOutlined,
  PhoneOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { usePrintInvoice } from "../hooks/usePrintInvoice";
import DefaultLayout from "../components/Defaultlayouts";
import { useAccounts, useAccountMutations, useAccountLedger } from "../hooks/usePosQueries";
import { useTenantSettings } from "../hooks/useTenantSettings";
import KhataStatementTemplate from "../templates/KhataStatementTemplate";
import "../styles/Pos.css";

const { Title, Text } = Typography;

// ─────────────────────────────────────────────
// Reusable AccountsPanel (used for both tabs)
// ─────────────────────────────────────────────
function AccountsPanel({ accountType, externalCreateOpen, onExternalCreateClose }) {
  const isCustomer = accountType === "Customer";

  const { data: accounts = [], isLoading, refetch } = useAccounts({ accountType });
  const { createAccount, recordPayment } = useAccountMutations();
  const { tenantSettings } = useTenantSettings();

  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [statementDrawerOpen, setStatementDrawerOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);

  const [formCreate] = Form.useForm();
  const [formPayment] = Form.useForm();

  const { printRef: statementPrintRef, printNow: handlePrintStatement } =
    usePrintInvoice("thermal80mm");

  const {
    data: ledgerData,
    isLoading: loadingLedger,
    refetch: refetchLedger,
  } = useAccountLedger(activeAccount?._id);

  // ── KPI calculations ──
  const stats = useMemo(() => {
    let total = 0;
    let withBalance = 0;
    accounts.forEach((acc) => {
      const bal = Number(acc.currentBalance || 0);
      if (bal > 0) { total += bal; withBalance++; }
    });
    return {
      totalAccounts: accounts.length,
      withBalance,
      totalBalance: Number(total.toFixed(2)),
    };
  }, [accounts]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        !search ||
        acc.name?.toLowerCase().includes(search.toLowerCase()) ||
        acc.phone?.includes(search) ||
        acc.accountCode?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      const bal = Number(acc.currentBalance || 0);
      if (balanceFilter === "debt") return bal > 0;
      if (balanceFilter === "cleared") return bal <= 0;
      return true;
    });
  }, [accounts, search, balanceFilter]);

  // ── Handlers ──
  const handleOpenPayment = (account) => {
    setActiveAccount(account);
    formPayment.setFieldsValue({
      amount: account.currentBalance > 0 ? account.currentBalance : 0,
      paymentMethod: "cash",
      notes: `${isCustomer ? "Payment received from" : "Payment issued to"} ${account.name}`,
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (values) => {
    if (!activeAccount) return;
    try {
      await recordPayment.mutateAsync({
        accountId: activeAccount._id,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
      });
      message.success(`PKR ${Number(values.amount).toFixed(2)} payment recorded!`);
      setPaymentModalOpen(false);
      formPayment.resetFields();
      refetch();
      if (statementDrawerOpen) refetchLedger();
    } catch (err) {
      message.error(err.response?.data?.error || err.message || "Failed to record payment");
    }
  };

  const handleCreateSubmit = async (values) => {
    try {
      await createAccount.mutateAsync({ ...values, accountType });
      message.success(`${isCustomer ? "Customer" : "Supplier"} account registered!`);
      setCreateModalOpen(false);
      onExternalCreateClose?.();
      formCreate.resetFields();
      refetch();
    } catch (err) {
      message.error(err.response?.data?.error || err.message || "Failed to create account");
    }
  };

  // ── Ledger running balance ──
  const transactions = ledgerData?.transactions || [];
  const transactionsWithRunningBalance = useMemo(() => {
    if (!transactions.length) return [];
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0)
    );
    let running = Number(activeAccount?.openingBalance || 0);
    return sorted.map((t) => {
      const isPayment = t.invoiceType === "Payment";
      const debit = !isPayment ? Number(t.totalAmount || 0) : 0;
      const credit = isPayment ? Number(t.paidAmount || t.totalAmount || 0) : Number(t.paidAmount || 0);
      running = running + debit - credit;
      return { ...t, debit, credit, runningBalance: running };
    }).reverse();
  }, [transactions, activeAccount]);

  // ── Colour palette per type ──
  const primary = isCustomer ? "#183c35" : "#1d3461";
  const accent  = isCustomer ? "#2d8a55" : "#2c6fad";
  const debtColor = "#cf1322";

  // ── Table columns ──
  const columns = [
    {
      title: isCustomer ? "Customer & Code" : "Supplier & Code",
      key: "name",
      render: (_, rec) => (
        <Space size={12}>
          <Avatar
            style={{
              backgroundColor: Number(rec.currentBalance) > 0 ? "#fff1f0" : "#e6f2f8",
              color: Number(rec.currentBalance) > 0 ? debtColor : primary,
              fontWeight: 700,
              border: `1px solid ${Number(rec.currentBalance) > 0 ? "#ffa39e" : "#91caff"}`,
            }}
          >
            {rec.name?.slice(0, 1).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, color: primary, fontSize: 14 }}>{rec.name}</div>
            <Space size={4}>
              <Tag color={isCustomer ? "blue" : "purple"} style={{ fontSize: 11 }}>
                {rec.accountCode || (isCustomer ? "CUST" : "SUPP")}
              </Tag>
              {rec.creditLimit > 0 && (
                <span style={{ fontSize: 11, color: "#888" }}>
                  Limit: PKR {Number(rec.creditLimit).toLocaleString()}
                </span>
              )}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      dataIndex: "phone",
      key: "phone",
      render: (phone) =>
        phone ? (
          <Space><PhoneOutlined style={{ color: accent }} /><span>{phone}</span></Space>
        ) : (
          <span style={{ color: "#aaa" }}>—</span>
        ),
    },
    {
      title: isCustomer ? "Outstanding Balance (Receivable)" : "Amount Payable",
      key: "currentBalance",
      render: (_, rec) => {
        const bal = Number(rec.currentBalance || 0);
        if (bal > 0)
          return <Tag color="volcano" style={{ fontSize: 13, padding: "3px 10px", fontWeight: 700 }}>PKR {bal.toFixed(2)} Due</Tag>;
        if (bal < 0)
          return <Tag color="cyan" style={{ fontSize: 13, padding: "3px 10px", fontWeight: 700 }}>PKR {Math.abs(bal).toFixed(2)} Advance</Tag>;
        return <Tag color="green" style={{ fontSize: 13, padding: "3px 10px" }}><CheckCircleOutlined /> Cleared</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, rec) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            style={{ backgroundColor: primary, borderColor: primary }}
            onClick={() => handleOpenPayment(rec)}
          >
            {isCustomer ? "Payment In" : "Pay Supplier"}
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => { setActiveAccount(rec); setStatementDrawerOpen(true); }}
          >
            Ledger
          </Button>
        </Space>
      ),
    },
  ];

  const kpiColor = isCustomer ? { high: debtColor, low: accent } : { high: "#d97706", low: "#2c6fad" };

  return (
    <>
      {/* ── KPI Row ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderTop: `3px solid ${kpiColor.high}` }}>
            <Statistic
              title={isCustomer ? "Total Receivables" : "Total Payables"}
              value={stats.totalBalance}
              prefix="PKR "
              precision={2}
              valueStyle={{ color: stats.totalBalance > 0 ? kpiColor.high : kpiColor.low, fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderTop: `3px solid ${kpiColor.high}` }}>
            <Statistic
              title={isCustomer ? "Accounts with Debt" : "Suppliers with Payables"}
              value={stats.withBalance}
              suffix={`/ ${stats.totalAccounts}`}
              valueStyle={{ color: "#d97706", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", borderTop: `3px solid ${primary}` }}>
            <Statistic
              title={isCustomer ? "Customer Accounts" : "Supplier Accounts"}
              value={stats.totalAccounts}
              prefix={isCustomer ? <UserOutlined /> : <ShopOutlined />}
              valueStyle={{ color: primary, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Search & Balance Filter ── */}
      <Card bordered={false} style={{ borderRadius: 10, marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={14}>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              placeholder={`Search ${isCustomer ? "customers" : "suppliers"} by name, phone or code…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={10}>
            <Radio.Group
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              buttonStyle="solid"
              style={{ width: "100%", display: "flex" }}
            >
              <Radio.Button value="all" style={{ flex: 1, textAlign: "center" }}>
                All ({accounts.length})
              </Radio.Button>
              <Radio.Button value="debt" style={{ flex: 1, textAlign: "center" }}>
                With Balance ({stats.withBalance})
              </Radio.Button>
              <Radio.Button value="cleared" style={{ flex: 1, textAlign: "center" }}>
                Cleared ({accounts.length - stats.withBalance})
              </Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* ── Accounts Table ── */}
      <Card bordered={false} style={{ borderRadius: 10 }}>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filtered}
          loading={isLoading}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No ${isCustomer ? "customer" : "supplier"} accounts found.`} /> }}
        />
      </Card>

      {/* ── Payment Modal ── */}
      <Modal
        title={
          <Space>
            <DollarOutlined style={{ color: accent }} />
            <span>{isCustomer ? "Record Customer Payment-In" : "Record Supplier Payment"}</span>
          </Space>
        }
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        okText="Confirm & Post Payment"
        confirmLoading={recordPayment.isPending}
        onOk={() => formPayment.submit()}
        destroyOnClose
      >
        {activeAccount && (
          <div style={{
            background: isCustomer ? "#f6ffed" : "#f0f5ff",
            border: `1px solid ${isCustomer ? "#b7eb8f" : "#adc6ff"}`,
            borderRadius: 8, padding: "12px 16px", marginBottom: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <Text strong style={{ fontSize: 15, color: primary }}>{activeAccount.name}</Text>
              <div style={{ fontSize: 12, color: "#666" }}>
                Code: {activeAccount.accountCode} | Phone: {activeAccount.phone || "N/A"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 11, color: "#888", display: "block" }}>
                {isCustomer ? "Current Debt" : "Amount Owed"}
              </span>
              <strong style={{ fontSize: 18, color: debtColor }}>
                PKR {Number(activeAccount.currentBalance || 0).toFixed(2)}
              </strong>
            </div>
          </div>
        )}

        <Form form={formPayment} layout="vertical" onFinish={handlePaymentSubmit}>
          <Form.Item
            name="amount"
            label="Amount (PKR)"
            rules={[
              { required: true, message: "Please enter amount" },
              { validator: (_, val) => Number(val) > 0 ? Promise.resolve() : Promise.reject("Must be > 0") },
            ]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} size="large" />
          </Form.Item>

          {activeAccount && Number(activeAccount.currentBalance || 0) > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Space size={8} wrap>
                <Text type="secondary" style={{ fontSize: 12 }}>Quick Fill:</Text>
                <Button size="small" onClick={() => formPayment.setFieldsValue({ amount: Number(activeAccount.currentBalance) })}>
                  Full (PKR {Number(activeAccount.currentBalance).toFixed(2)})
                </Button>
                <Button size="small" onClick={() => formPayment.setFieldsValue({ amount: Number((activeAccount.currentBalance / 2).toFixed(2)) })}>
                  50% (PKR {Number(activeAccount.currentBalance / 2).toFixed(2)})
                </Button>
              </Space>
            </div>
          )}

          <Form.Item name="paymentMethod" label="Payment Method" initialValue="cash">
            <Radio.Group optionType="button" buttonStyle="solid" style={{ width: "100%", display: "flex" }}>
              <Radio.Button value="cash" style={{ flex: 1, textAlign: "center" }}><DollarOutlined /> Cash</Radio.Button>
              <Radio.Button value="bank" style={{ flex: 1, textAlign: "center" }}><BankOutlined /> Bank</Radio.Button>
              <Radio.Button value="online" style={{ flex: 1, textAlign: "center" }}><CreditCardOutlined /> Online</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="notes" label="Notes / Reference">
            <Input placeholder="e.g. Cash counter clearance" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Create Account Modal ── */}
      <Modal
        title={
          <Space>
            {isCustomer ? <UserOutlined style={{ color: primary }} /> : <ShopOutlined style={{ color: primary }} />}
            <span>Register New {isCustomer ? "Customer" : "Supplier"} Account</span>
          </Space>
        }
        open={createModalOpen || externalCreateOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          onExternalCreateClose?.();
        }}
        okText={`Save ${isCustomer ? "Customer" : "Supplier"}`}
        confirmLoading={createAccount.isPending}
        onOk={() => formCreate.submit()}
        destroyOnClose
      >
        <Form form={formCreate} layout="vertical" onFinish={handleCreateSubmit}>
          <Form.Item
            name="name"
            label={isCustomer ? "Customer Full Name" : "Supplier / Company Name"}
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder={isCustomer ? "e.g. Haji Muhammad Aslam" : "e.g. Master Pipes & Co."} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="03001234567" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountCode" label="Account Code (Optional)">
                <Input placeholder="Auto-generated" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="openingBalance" label={isCustomer ? "Opening Debt / Balance" : "Opening Payable"} initialValue={0}>
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="creditLimit" label={isCustomer ? "Credit Limit" : "Purchase Limit"} initialValue={0}>
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address / Location">
            <Input placeholder="e.g. Main Hardware Market, Shop #4" />
          </Form.Item>

          <Form.Item name="notes" label="Account Notes">
            <Input.TextArea rows={2} placeholder="Payment terms, references…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Statement / Ledger Drawer ── */}
      <Drawer
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span>Khata Statement: {activeAccount?.name}</span>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              style={{ backgroundColor: primary, borderColor: primary }}
              onClick={handlePrintStatement}
            >
              Print
            </Button>
          </div>
        }
        placement="right"
        width={680}
        open={statementDrawerOpen}
        onClose={() => setStatementDrawerOpen(false)}
      >
        {activeAccount && (
          <div>
            {/* Header */}
            <div style={{
              background: primary, color: "#fff", padding: "16px 20px", borderRadius: 8,
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20,
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{activeAccount.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Code: {activeAccount.accountCode} | Phone: {activeAccount.phone || "N/A"}
                </div>
                <Badge
                  color={isCustomer ? "#52c41a" : "#722ed1"}
                  text={<span style={{ color: "#fff", fontSize: 11 }}>{isCustomer ? "Customer" : "Supplier"}</span>}
                />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase" }}>
                  {isCustomer ? "Outstanding Due" : "Payable Amount"}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#f2c14e" }}>
                  PKR {Number(activeAccount.currentBalance || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <Title level={5}>Statement & Ledger ({transactionsWithRunningBalance.length} entries)</Title>
            <Table
              rowKey="_id"
              size="small"
              loading={loadingLedger}
              dataSource={transactionsWithRunningBalance}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: "Date",
                  dataIndex: "date",
                  key: "date",
                  render: (d) => d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—",
                },
                {
                  title: "Type",
                  dataIndex: "invoiceType",
                  key: "invoiceType",
                  render: (type) => (
                    <Tag color={type === "Payment" ? "green" : isCustomer ? "blue" : "purple"}>
                      {type || (isCustomer ? "Sale" : "Purchase")}
                    </Tag>
                  ),
                },
                {
                  title: "Ref #",
                  key: "ref",
                  render: (_, t) => t.invoiceNumber || (t._id ? t._id.slice(-6).toUpperCase() : "—"),
                },
                {
                  title: "Debit (+)",
                  dataIndex: "debit",
                  key: "debit",
                  align: "right",
                  render: (amt) =>
                    amt > 0
                      ? <span style={{ color: debtColor, fontWeight: 600 }}>+{Number(amt).toFixed(2)}</span>
                      : <span style={{ color: "#ccc" }}>—</span>,
                },
                {
                  title: "Credit (−)",
                  dataIndex: "credit",
                  key: "credit",
                  align: "right",
                  render: (amt) =>
                    amt > 0
                      ? <span style={{ color: accent, fontWeight: 600 }}>−{Number(amt).toFixed(2)}</span>
                      : <span style={{ color: "#ccc" }}>—</span>,
                },
                {
                  title: "Running Due",
                  dataIndex: "runningBalance",
                  key: "runningBalance",
                  align: "right",
                  render: (bal) => (
                    <strong style={{ color: bal > 0 ? debtColor : accent }}>
                      {Number(bal || 0).toFixed(2)}
                    </strong>
                  ),
                },
              ]}
            />

            {/* Hidden print template */}
            <div style={{ display: "none" }}>
              <KhataStatementTemplate
                ref={statementPrintRef}
                account={activeAccount}
                transactions={transactions}
                tenant={tenantSettings}
              />
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

// ─────────────────────────────────────────────
// Main Page: Khata Ledger with Customer/Supplier Tabs
// ─────────────────────────────────────────────
export default function KhataLedgerPage() {
  const [activeTab, setActiveTab] = useState("customers");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Shared "New Account" button label depends on active tab
  const isCustomerTab = activeTab === "customers";

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: 40 }}>

        {/* ── Page Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 20, flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <span style={{ fontSize: 12, color: "#2d8a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Accounts Book
            </span>
            <Title level={2} style={{ margin: 0, color: "#183c35" }}>
              <WalletOutlined style={{ marginRight: 10, color: "#2d8a55" }} />
              Khata Ledger
            </Title>
          </div>
        </div>

        {/* ── Tabbed Interface ── */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          type="card"
          tabBarExtraContent={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: isCustomerTab ? "#183c35" : "#1d3461", borderColor: isCustomerTab ? "#183c35" : "#1d3461" }}
              onClick={() => setCreateModalOpen(true)}
            >
              New {isCustomerTab ? "Customer" : "Supplier"}
            </Button>
          }
          items={[
            {
              key: "customers",
              label: (
                <Space>
                  <UserOutlined />
                  <span style={{ fontWeight: 600 }}>Customers (Receivables)</span>
                </Space>
              ),
              children: (
                <AccountsPanel
                  accountType="Customer"
                  externalCreateOpen={isCustomerTab && createModalOpen}
                  onExternalCreateClose={() => setCreateModalOpen(false)}
                />
              ),
            },
            {
              key: "suppliers",
              label: (
                <Space>
                  <ShopOutlined />
                  <span style={{ fontWeight: 600 }}>Suppliers (Payables)</span>
                </Space>
              ),
              children: (
                <AccountsPanel
                  accountType="Supplier"
                  externalCreateOpen={!isCustomerTab && createModalOpen}
                  onExternalCreateClose={() => setCreateModalOpen(false)}
                />
              ),
            },
          ]}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "4px 16px 0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        />
      </div>
    </DefaultLayout>
  );
}
