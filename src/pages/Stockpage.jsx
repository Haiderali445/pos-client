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
  ReloadOutlined,
  RiseOutlined,
  ShoppingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
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
  const { data: products = [], isLoading: pLoading, isError: pError, refetch: pRefetch } = useProducts();
  const { data: bills = [], isLoading: bLoading, isError: bError, refetch: bRefetch } = useBills();
  const { data: charges = [], isLoading: cLoading, isError: cError, refetch: cRefetch } = useCharges();

  const isLoading = pLoading || bLoading || cLoading;
  const isError = pError || bError || cError;

  // Pure decoupled financial & inventory metrics calculation
  const metrics = useMemo(
    () => calculateFinancialMetrics(products, bills, charges),
    [products, bills, charges]
  );

  // Pure decoupled chart data transformations
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
      render: (cat) => <Tag color="blue">{cat || "General"}</Tag>,
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
        return (
          <Space size={8}>
            <strong>{Math.max(0, Number(stock) || 0)} units</strong>
            <Tag color={status.color}>{status.isOutOfStock ? "Depleted" : status.isLowStock ? "Low" : "Healthy"}</Tag>
          </Space>
        );
      },
    },
    {
      title: "Total Asset Value",
      key: "assetValue",
      render: (_, record) => (
        <strong>
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
          <Button icon={<ReloadOutlined />} onClick={handleRefetchAll} loading={isLoading}>
            Recalculate
          </Button>
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

        {/* Core Financial KPIs */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Current Stock Valuation (Cost)"
                value={formatCurrency(metrics.currentInventoryValuation)}
                prefix={<ShoppingOutlined style={{ color: "#183c35" }} />}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Potential Retail: {formatCurrency(metrics.potentialRetailValuation)}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Total Sales Revenue"
                value={formatCurrency(metrics.totalSalesRevenue)}
                valueStyle={{ color: "#2d8a55" }}
                prefix={<RiseOutlined />}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                COGS: {formatCurrency(metrics.totalCogs)}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Gross Profit"
                value={formatCurrency(metrics.grossProfit)}
                valueStyle={{ color: "#183c35" }}
                prefix={<DollarOutlined />}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Store Expenses: {formatCurrency(metrics.totalExpenses)}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Net Profit (After Expenses)"
                value={formatCurrency(metrics.netProfit)}
                valueStyle={{ color: metrics.netProfit >= 0 ? "#2d8a55" : "#cf1322" }}
                prefix={metrics.netProfit >= 0 ? <RiseOutlined /> : <FallOutlined />}
              />
              <div style={{ marginTop: 4 }}>
                <Tag color={metrics.profitMargin >= 0 ? "success" : "error"}>
                  Margin: {metrics.profitMargin.toFixed(1)}%
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Visual Charts */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12} style={{ minWidth: 0 }}>
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: "#183c35" }} />
                  <span>Financial Breakdown</span>
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
                  <span>Stock Valuation by Category</span>
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

        {/* Live Inventory Detailed Table */}
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Live Stock Level & Valuation Table ({products.length} items)</span>
              {metrics.lowStockItems.length > 0 && (
                <Tag color="warning" icon={<WarningOutlined />}>
                  {metrics.lowStockItems.length} Low Stock Alert(s)
                </Tag>
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
