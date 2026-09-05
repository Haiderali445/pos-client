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
  const { data: itemsData = [], isLoading, isError, refetch } = useProducts();
  const { addProduct, editProduct, deleteProduct } = useProductMutations();

  const [popupModal, setPopupModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form] = Form.useForm();

  // Pure decoupled calculations and filtering
  const stats = useMemo(() => calculateItemStats(itemsData), [itemsData]);
  const categories = useMemo(() => extractItemCategories(itemsData), [itemsData]);
  const filteredItems = useMemo(
    () => filterItems(itemsData, search, categoryFilter),
    [itemsData, search, categoryFilter]
  );

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
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: "Stock Value",
      key: "stockValue",
      render: (_, record) => (
        <Text type="secondary">
          {formatCurrency(computeItemValuation(record.purchasePrice, record.stock))}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="Edit Product">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
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
        </Space>
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
            >
              Add New Product
            </Button>
          </Space>
        </div>

        {/* Stock Overview Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Catalog Items"
                value={stats.totalCount}
                prefix={<CarryOutOutlined style={{ color: "#183c35" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Total Stock Units"
                value={stats.totalStockUnits}
                valueStyle={{ color: "#2d8a55" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Low Stock Alerts"
                value={stats.lowStockCount}
                valueStyle={{ color: stats.lowStockCount > 0 ? "#faad14" : "#8c8c8c" }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Inventory Valuation"
                value={formatCurrency(stats.inventoryValuation)}
                prefix={<DollarOutlined style={{ color: "#183c35" }} />}
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
              style={{ maxWidth: 360 }}
            />
            <Space>
              <Text style={{ fontSize: 13, color: "#666" }}>Filter Category:</Text>
              <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 140 }}>
                {categories.map((c) => (
                  <Option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </Option>
                ))}
              </Select>
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
            locale={{ emptyText: <Empty description="No products found" /> }}
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
