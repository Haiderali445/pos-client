import React, { useMemo } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  DollarOutlined,
  FallOutlined,
  InboxOutlined,
  ReloadOutlined,
  RiseOutlined,
  ShoppingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import DefaultLayout from "../components/Defaultlayouts";
import { useBills, useCharges, useProducts } from "../hooks/usePosQueries";
import {
  calculateFinancialMetrics,
  getFinancialPieData,
  getCategoryChartData,
  formatCurrency,
  getStockStatus,
  computeItemAssetValue,
} from "../handlers/stockHandlers";

const { Title, Text } = Typography;

const FINANCIAL_COLORS = ["#0f766e", "#2563eb", "#f59e0b", "#dc2626"];

export default function StockPage() {
  const navigate = useNavigate();
  const { data: products = [], isLoading: pLoading, isError: pError, refetch: pRefetch } = useProducts();
  const { data: bills = [], isLoading: bLoading, isError: bError, refetch: bRefetch } = useBills();
  const { data: charges = [], isLoading: cLoading, isError: cError, refetch: cRefetch } = useCharges();

  const isLoading = pLoading || bLoading || cLoading;
  const isError = pError || bError || cError;

  const metrics = useMemo(
    () => calculateFinancialMetrics(products, bills, charges),
    [products, bills, charges]
  );

  const financialPieData = useMemo(() => getFinancialPieData(metrics), [metrics]);
  const categoryChartData = useMemo(() => getCategoryChartData(products), [products]);

  const handleRefetchAll = () => {
    pRefetch();
    bRefetch();
    cRefetch();
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <strong style={{ color: "#183c35" }}>{name}</strong>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
          {cat || "General"}
        </Tag>
      ),
    },
    {
      title: "Cost Price",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Retail Price",
      dataIndex: "salePrice",
      key: "salePrice",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Current Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock, record) => {
        const status = getStockStatus(stock, record.reorderLevel);
        const isDepleted = status.isOutOfStock;
        const isLow = status.isLowStock;

        return (
          <Space size={8}>
            <strong style={{ fontSize: 13, color: "#183c35" }}>
              {Math.max(0, Number(stock) || 0)} units
            </strong>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 11,
                padding: "2px 10px",
                border: isDepleted
                  ? "1px solid #fca5a5"
                  : isLow
                  ? "1px solid #ffd57e"
                  : "1px solid #7be4a3",
                backgroundColor: isDepleted
                  ? "#fee2e2"
                  : isLow
                  ? "#fff8e6"
                  : "#e6f9ed",
                color: isDepleted ? "#991b1b" : isLow ? "#925400" : "#0d6832",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isDepleted
                    ? "#cf1322"
                    : isLow
                    ? "#d46b08"
                    : "#059669",
                }}
              />
              {isDepleted ? "DEPLETED" : isLow ? "LOW STOCK" : "HEALTHY"}
            </span>
          </Space>
        );
      },
    },
    {
      title: "Total Asset Value",
      key: "assetValue",
      render: (_, record) => (
        <strong style={{ color: "#183c35", fontSize: 13 }}>
          {formatCurrency(computeItemAssetValue(record.purchasePrice, record.stock))}
        </strong>
      ),
    },
  ];

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b9991", fontWeight: 700 }}>
              Business Intelligence & Inventory
            </span>
            <Title level={2} style={{ margin: "2px 0 0", color: "#183c35" }}>
              Stock & Sales Analytics
            </Title>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<InboxOutlined />}
              style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
              onClick={() => navigate("/purchase-orders")}
            >
              Purchase Orders & GRN
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefetchAll} loading={isLoading}>
              Recalculate
            </Button>
          </Space>
        </div>

        {isError && (
          <Alert
            type="error"
            showIcon
            message="Failed to load analytics data"
            action={<Button size="small" onClick={handleRefetchAll}>Retry</Button>}
            style={{ marginBottom: 20 }}
          />
        )}

        {/* Top KPI Cards with Custom Styled Borders */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: "3px solid #183c35",
                background: "#ffffff",
              }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#183c35", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Stock Valuation (Cost)
                  </span>
                }
                value={formatCurrency(metrics.currentInventoryValuation)}
                valueStyle={{ color: "#183c35", fontWeight: 800, fontSize: 22 }}
                prefix={<ShoppingOutlined style={{ color: "#183c35", marginRight: 4 }} />}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Potential Retail: {formatCurrency(metrics.potentialRetailValuation)}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0d6832", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Total Sales Revenue
                  </span>
                }
                value={formatCurrency(metrics.totalSalesRevenue)}
                valueStyle={{ color: "#0d6832", fontWeight: 800, fontSize: 22 }}
                prefix={<RiseOutlined style={{ color: "#2d8a55", marginRight: 4 }} />}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                COGS: {formatCurrency(metrics.totalCogs)}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: "3px solid #0f766e",
                background: "#ffffff",
              }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Gross Profit
                  </span>
                }
                value={formatCurrency(metrics.grossProfit)}
                valueStyle={{ color: "#0f766e", fontWeight: 800, fontSize: 22 }}
                prefix={<DollarOutlined style={{ color: "#0f766e", marginRight: 4 }} />}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Store Expenses: {formatCurrency(metrics.totalExpenses)}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: `3px solid ${metrics.netProfit >= 0 ? "#2d8a55" : "#cf1322"}`,
                background: "#ffffff",
              }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: 12, fontWeight: 700, color: metrics.netProfit >= 0 ? "#0d6832" : "#b45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Net Profit (After Expenses)
                  </span>
                }
                value={formatCurrency(metrics.netProfit)}
                valueStyle={{ color: metrics.netProfit >= 0 ? "#0d6832" : "#cf1322", fontWeight: 800, fontSize: 22 }}
                prefix={metrics.netProfit >= 0 ? <RiseOutlined style={{ color: "#2d8a55" }} /> : <FallOutlined style={{ color: "#cf1322" }} />}
              />
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 8px",
                    border: metrics.profitMargin >= 0 ? "1px solid #7be4a3" : "1px solid #fca5a5",
                    backgroundColor: metrics.profitMargin >= 0 ? "#e6f9ed" : "#fee2e2",
                    color: metrics.profitMargin >= 0 ? "#0d6832" : "#991b1b",
                  }}
                >
                  Margin: {metrics.profitMargin.toFixed(1)}%
                </span>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12} style={{ minWidth: 0 }}>
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: "#183c35" }} />
                  <span style={{ fontWeight: 700, color: "#183c35" }}>Financial Breakdown</span>
                </Space>
              }
              bordered={false}
              style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.05)", borderRadius: 12, height: "100%" }}
            >
              <div style={{ width: "100%", minWidth: 0, height: 280, minHeight: 280 }}>
                {financialPieData.some((entry) => entry.value > 0) ? (
                  <ResponsiveContainer width="100%" height={280} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={financialPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="44%"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={2}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {financialPieData.map((_, index) => (
                          <Cell key={`financial-pie-${index}`} fill={FINANCIAL_COLORS[index % FINANCIAL_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                      <Legend
                        verticalAlign="bottom"
                        height={54}
                        formatter={(value, entry) => `${value}: ${formatCurrency(entry.payload.value)}`}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No financial data available" />
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12} style={{ minWidth: 0 }}>
            <Card
              title={
                <Space>
                  <BarChartOutlined style={{ color: "#183c35" }} />
                  <span style={{ fontWeight: 700, color: "#183c35" }}>Stock Valuation by Category</span>
                </Space>
              }
              bordered={false}
              style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.05)", borderRadius: 12, height: "100%" }}
            >
              <div style={{ width: "100%", minWidth: 0, height: 280, minHeight: 280 }}>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280} minWidth={0}>
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                      <Bar dataKey="valuation" fill="#183c35" radius={[6, 6, 0, 0]} name="Valuation (PKR)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No stock data available" />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Live Inventory Table */}
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#183c35" }}>Live Stock Directory ({products.length} items)</span>
              {metrics.lowStockItems.length > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 11,
                    padding: "3px 12px",
                    border: "1px solid #ffd57e",
                    backgroundColor: "#fff8e6",
                    color: "#925400",
                  }}
                >
                  <WarningOutlined style={{ fontSize: 11 }} />
                  {metrics.lowStockItems.length} Low Stock Alert(s)
                </span>
              )}
            </div>
          }
          bordered={false}
          style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.05)", borderRadius: 12 }}
        >
          <Table
            columns={columns}
            dataSource={products}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No inventory items recorded" /> }}
          />
        </Card>
      </div>
    </DefaultLayout>
  );
}