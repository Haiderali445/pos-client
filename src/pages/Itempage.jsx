import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
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
  BarcodeOutlined,
  CarryOutOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import DefaultLayout from "../components/Defaultlayouts";
import { useProductMutations, useProducts } from "../hooks/usePosQueries";
import usePermission from "../hooks/usePermission";
import {
  calculateItemStats,
  extractItemCategories,
  filterItems,
  formatCurrency,
  getItemStockBadge,
  computeItemValuation,
  handleProductSubmit,
  handleProductDelete,
} from "../handlers/itemHandlers";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ItemPage() {
  const { can } = usePermission();
  const { data: itemsData = [], isLoading, isError, refetch } = useProducts();
  const { addProduct, editProduct, deleteProduct } = useProductMutations();

  const [popupModal, setPopupModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [form] = Form.useForm();

  // Pure decoupled calculations
  const stats = useMemo(() => calculateItemStats(itemsData), [itemsData]);
  const categories = useMemo(() => extractItemCategories(itemsData), [itemsData]);

  // Combined Search, Category, and Stock Level Filter
  const filteredItems = useMemo(() => {
    let result = filterItems(itemsData, search, categoryFilter);

    if (stockFilter !== "all") {
      result = result.filter((item) => {
        const isOut = item.stock < 1;
        const isLow = !isOut && item.stock <= (item.reorderLevel || 5);

        if (stockFilter === "low") return isLow;
        if (stockFilter === "out") return isOut;
        if (stockFilter === "in_stock") return !isOut && !isLow;
        return true;
      });
    }

    return result;
  }, [itemsData, search, categoryFilter, stockFilter]);

  // Handle item deletion
  const handleDelete = async (record) => {
    await handleProductDelete({
      deleteProduct,
      itemId: record._id,
    });
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    await handleProductSubmit({
      addProduct,
      editProduct,
      editItem,
      values,
      onSuccess: () => {
        setPopupModal(false);
        setEditItem(null);
        form.resetFields();
      },
    });
  };

  const openAddModal = () => {
    setEditItem(null);
    form.resetFields();
    setPopupModal(true);
  };

  const openEditModal = (record) => {
    setEditItem(record);
    form.setFieldsValue({
      name: record.name,
      purchasePrice: record.purchasePrice,
      salePrice: record.salePrice,
      stock: record.stock,
      category: record.category,
      image: record.image,
      barcode: record.barcode,
      sku: record.sku,
    });
    setPopupModal(true);
  };

  const columns = [
    {
      title: "Product",
      key: "name",
      render: (_, record) => (
        <Space size={12}>
          {record.image ? (
            <img
              src={record.image}
              alt={record.name}
              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, backgroundColor: "#f4f7f4" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <Avatar shape="square" size={44} style={{ backgroundColor: "#e6f2eb", color: "#183c35", fontWeight: 700 }}>
              {record.name.slice(0, 1).toUpperCase()}
            </Avatar>
          )}
          <div>
            <div style={{ fontWeight: 600, color: "#183c35" }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.sku ? `SKU: ${record.sku}` : record.barcode ? `Barcode: ${record.barcode}` : "No code"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat) => <Tag color="geekblue">{cat || "General"}</Tag>,
    },
    {
      title: "Cost Price",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Sale Price",
      dataIndex: "salePrice",
      key: "salePrice",
      render: (val) => <strong>{formatCurrency(val)}</strong>,
    },
    {
      title: "Stock Status",
      key: "stock",
      render: (_, record) => {
        const badge = getItemStockBadge(record.stock, record.reorderLevel);
        const isOut = record.stock < 1;
        const isLow = !isOut && record.stock <= (record.reorderLevel || 5);

        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 12,
              padding: "3px 10px",
              border: isOut
                ? "1px solid #fca5a5"
                : isLow
                ? "1px solid #ffd57e"
                : "1px solid #7be4a3",
              backgroundColor: isOut
                ? "#fee2e2"
                : isLow
                ? "#fff8e6"
                : "#e6f9ed",
              color: isOut ? "#991b1b" : isLow ? "#925400" : "#0d6832",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: isOut
                  ? "#cf1322"
                  : isLow
                  ? "#d97706"
                  : "#059669",
              }}
            />
            {record.stock} units {badge.status !== "ok" ? `(${badge.label})` : ""}
          </span>
        );
      },
    },
    {
      title: "FIFO Batches & Margin",
      key: "batchesMargin",
      render: (_, record) => {
        const activeBatches = (record.stockBatches || []).filter(
          (b) => Number(b.availableQty) > 0
        );
        const batchCount = activeBatches.length || (Number(record.stock) > 0 ? 1 : 0);
        const cost = Number(record.purchasePrice || 0);
        const sale = Number(record.salePrice || 0);
        const profit = Math.max(0, sale - cost);
        const marginPct = sale > 0 ? ((profit / sale) * 100).toFixed(0) : 0;

        return (
          <Space direction="vertical" size={3}>
            <Tag color="purple" style={{ borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
              {batchCount} {batchCount === 1 ? "Active Batch" : "Active Batches"}
            </Tag>
            {profit > 0 ? (
              <Tag color="green" style={{ borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                +{formatCurrency(profit)} ({marginPct}%)
              </Tag>
            ) : (
              <Tag color="default" style={{ borderRadius: 4, fontSize: 11 }}>
                Zero Margin
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Stock Value",
      key: "stockValue",
      render: (_, record) => (
        <strong style={{ color: "#183c35", fontWeight: 700, fontSize: 13 }}>
          {formatCurrency(computeItemValuation(record.purchasePrice, record.stock))}
        </strong>
      ),
    },
    ...(can("catalog:manage") || can("catalog:delete")
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space size={8}>
                {can("catalog:manage") && (
                  <Tooltip title="Edit Product">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(record)}
                    />
                  </Tooltip>
                )}
                {can("catalog:delete") && (
                  <Popconfirm
                    title="Delete this product?"
                    description="Are you sure you want to remove this item from the store?"
                    onConfirm={() => handleDelete(record)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b9991", fontWeight: 700 }}>
              Inventory Control
            </span>
            <Title level={2} style={{ margin: "2px 0 0", color: "#183c35" }}>
              Products & Stock Directory
            </Title>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Refresh
            </Button>
            {can("catalog:manage") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddModal}
                style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
              >
                Add New Product
              </Button>
            )}
          </Space>
        </div>

        {/* Stock Overview Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
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
                title={<span style={{ fontWeight: 700, color: "#183c35", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Catalog Items</span>}
                value={stats.totalCount}
                valueStyle={{ color: "#183c35", fontWeight: 800, fontSize: 26 }}
                prefix={<CarryOutOutlined style={{ color: "#183c35", marginRight: 4 }} />}
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
                title={<span style={{ fontWeight: 700, color: "#0d6832", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Stock Units</span>}
                value={stats.totalStockUnits}
                valueStyle={{ color: "#0d6832", fontWeight: 800, fontSize: 26 }}
                suffix={<span style={{ fontSize: 13, color: "#526e60", fontWeight: 600 }}>units</span>}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")}
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: `3px solid ${stats.lowStockCount > 0 ? "#faad14" : "#8c8c8c"}`,
                background: stockFilter === "low" ? "#fffdf5" : "#ffffff",
                cursor: "pointer",
              }}
            >
              <Statistic
                title={<span style={{ fontWeight: 700, color: stats.lowStockCount > 0 ? "#b45309" : "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Low Stock Alerts</span>}
                value={stats.lowStockCount}
                valueStyle={{ color: stats.lowStockCount > 0 ? "#b45309" : "#8c8c8c", fontWeight: 800, fontSize: 26 }}
                prefix={<WarningOutlined style={{ color: stats.lowStockCount > 0 ? "#faad14" : "#8c8c8c" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
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
                title={<span style={{ fontWeight: 700, color: "#0f766e", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Inventory Valuation</span>}
                value={formatCurrency(stats.inventoryValuation)}
                valueStyle={{ color: "#0f766e", fontWeight: 800, fontSize: 22 }}
                prefix={<DollarOutlined style={{ color: "#0f766e" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Table */}
        <Card bordered={false} style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.05)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
            <Input
              placeholder="Search by name, SKU, or barcode..."
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ maxWidth: 320 }}
            />
            <Space wrap>
              {/* Category Filter */}
              <Space>
                <Text style={{ fontSize: 13, color: "#666" }}>Category:</Text>
                <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 140 }}>
                  {categories.map((c) => (
                    <Option key={c} value={c}>
                      {c === "all" ? "All Categories" : c}
                    </Option>
                  ))}
                </Select>
              </Space>

              {/* Stock Status Filter */}
              <Space>
                <Text style={{ fontSize: 13, color: "#666" }}>Stock Level:</Text>
                <Select value={stockFilter} onChange={setStockFilter} style={{ width: 150 }}>
                  <Option value="all">All Levels</Option>
                  <Option value="in_stock">In Stock</Option>
                  <Option value="low">Low Stock Alerts</Option>
                  <Option value="out">Out of Stock</Option>
                </Select>
              </Space>
            </Space>
          </div>

          {isError && (
            <Alert
              type="error"
              showIcon
              message="Failed to load items catalog"
              action={<Button size="small" onClick={() => refetch()}>Retry</Button>}
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No products match your filters" /> }}
            expandable={{
              expandedRowRender: (record) => {
                const batches = record.stockBatches || [];
                if (batches.length === 0) {
                  return (
                    <div style={{ padding: "8px 16px", color: "#888", fontSize: 12 }}>
                      No separate purchase batches recorded. Single-pool baseline stock active.
                    </div>
                  );
                }
                return (
                  <div style={{ margin: "4px 0", backgroundColor: "#fbfcfb", padding: 12, borderRadius: 8, border: "1px solid #e8f0ec" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "#183c35" }}>
                      Active & Depleted FIFO Stock Batches for {record.name}
                    </div>
                    <Table
                      size="small"
                      rowKey={(b, idx) => b.batchCode || idx}
                      pagination={false}
                      dataSource={batches}
                      columns={[
                        {
                          title: "Batch Code",
                          dataIndex: "batchCode",
                          key: "batchCode",
                          render: (c) => <Tag color="purple" style={{ fontFamily: "monospace" }}>{c}</Tag>,
                        },
                        {
                          title: "Available Qty",
                          dataIndex: "availableQty",
                          key: "avail",
                          render: (q) => <strong>{q} units</strong>,
                        },
                        {
                          title: "Initial Qty",
                          dataIndex: "qty",
                          key: "qty",
                          render: (q) => `${q || 0} units`,
                        },
                        {
                          title: "Batch Unit Cost",
                          dataIndex: "unitCost",
                          key: "cost",
                          render: (c) => formatCurrency(c),
                        },
                        {
                          title: "Intake Date",
                          dataIndex: "receivedDate",
                          key: "recv",
                          render: (d) => (d ? new Date(d).toLocaleDateString() : "-"),
                        },
                        {
                          title: "FIFO Status",
                          key: "status",
                          render: (_, b) => (
                            <Tag color={Number(b.availableQty) > 0 ? "success" : "default"}>
                              {Number(b.availableQty) > 0 ? "Active in Queue" : "Fully Depleted"}
                            </Tag>
                          ),
                        },
                      ]}
                    />
                  </div>
                );
              },
            }}
          />
        </Card>

        {/* Add / Edit Product Modal */}
        <Modal
          title={editItem ? "Edit Product Details" : "Add New Inventory Product"}
          open={popupModal}
          onCancel={() => {
            setPopupModal(false);
            setEditItem(null);
          }}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ stock: 1, category: "Others" }}
          >
            <Form.Item
              label="Product Name"
              name="name"
              rules={[{ required: true, message: "Please enter product name" }]}
            >
              <Input placeholder="e.g. Copper Water Pipe 1/2 in" />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="Purchase / Cost Price (PKR)"
                  name="purchasePrice"
                  rules={[{ required: true, message: "Enter purchase cost" }]}
                >
                  <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="0.00" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Sale Price (PKR)"
                  name="salePrice"
                  rules={[{ required: true, message: "Enter retail price" }]}
                >
                  <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="0.00" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="Initial / Current Stock"
                  name="stock"
                  rules={[{ required: true, message: "Enter stock quantity" }]}
                >
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="Units" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Select placeholder="Select category">
                    <Option value="Shower">Shower</Option>
                    <Option value="Sink">Sink</Option>
                    <Option value="Tap">Tap</Option>
                    <Option value="Nails">Nails</Option>
                    <Option value="Pipe">Pipe</Option>
                    <Option value="Water Tank">Water Tank</Option>
                    <Option value="Elbow">Elbow</Option>
                    <Option value="Tools">Tools</Option>
                    <Option value="Electrical">Electrical</Option>
                    <Option value="Others">Others</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="barcode" label="Barcode / UPC (Optional)">
                  <Input prefix={<BarcodeOutlined />} placeholder="Scan or enter code" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="sku" label="SKU / Item Code (Optional)">
                  <Input placeholder="e.g. PIP-CP-001" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Image URL (Optional)"
              name="image"
              rules={[{ type: "url", warningOnly: true, message: "Enter a valid URL" }]}
            >
              <Input placeholder="https://example.com/image.jpg" />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <Button onClick={() => setPopupModal(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={addProduct.isPending || editProduct.isPending}
                style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
              >
                {editItem ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </DefaultLayout>
  );
}