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
  Modal,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PlusSquareOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DefaultLayout from "../components/Defaultlayouts";
import { useDealerMutations, useDealers } from "../hooks/usePosQueries";
import usePermission from "../hooks/usePermission";

const { Title, Text } = Typography;

export default function DealerPage() {
  const { can } = usePermission();
  const { data: dealersData = [], isLoading, isError, refetch } = useDealers();
  const { addDealer, editDealer, deleteDealer } = useDealerMutations();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [form] = Form.useForm();

  // Filtered dealers search query logic
  const filteredDealers = useMemo(() => {
    return dealersData.filter((d) => {
      const haystack = [
        d.dealerName,
        d.contactName,
        d.shopName,
        d.address,
        d.products,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });
  }, [dealersData, searchQuery]);

  const handleOpenAdd = () => {
    setEditingDealer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingDealer(record);
    form.setFieldsValue({
      dealerName: record.dealerName,
      contactName: record.contactName,
      shopName: record.shopName,
      address: record.address,
      products: record.products,
    });
    setIsModalVisible(true);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingDealer) {
        await editDealer.mutateAsync({
          ...values,
          dealerId: editingDealer._id,
        });
        message.success("Dealer information updated!");
      } else {
        await addDealer.mutateAsync(values);
        message.success("New dealer added successfully!");
      }
      setIsModalVisible(false);
      setEditingDealer(null);
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to save dealer details.");
    }
  };

  const handleDelete = async (dealer) => {
    try {
      await deleteDealer.mutateAsync(dealer._id);
      message.success("Dealer removed from records.");
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to delete dealer.");
    }
  };

  const columns = [
    {
      title: "Supplier / Dealer",
      key: "dealer",
      render: (_, record) => (
        <Space size={12}>
          <Avatar
            style={{
              backgroundColor: "#e6f2eb",
              color: "#183c35",
              fontWeight: 700,
            }}
          >
            {record.dealerName ? record.dealerName.slice(0, 1).toUpperCase() : "D"}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: "#183c35" }}>
              {record.dealerName || "Unnamed Dealer"}
            </div>
            {record.shopName && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                <ShopOutlined /> {record.shopName}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Contact Person & Phone",
      key: "contact",
      render: (_, record) => (
        <div>
          <div>
            <UserOutlined style={{ marginRight: 4 }} />
            {record.contactName || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (addr) => (
        <span>
          <EnvironmentOutlined style={{ marginRight: 4, color: "#8c8c8c" }} />
          {addr || "—"}
        </span>
      ),
    },
    {
      title: "Product Lines Supplied",
      dataIndex: "products",
      key: "products",
      render: (products) => (
        <span>
          {products ? (
            products.split(",").map((p, i) => (
              <Tag key={i} color="geekblue" style={{ margin: "2px" }}>
                {p.trim()}
              </Tag>
            ))
          ) : (
            <Text type="secondary">—</Text>
          )}
        </span>
      ),
    },
    ...(can("dealers:manage")
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space size={8}>
                <Tooltip title="Edit Supplier">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenEdit(record)}
                  />
                </Tooltip>
                <Popconfirm
                  title="Delete this supplier?"
                  description="Are you sure you want to remove this dealer?"
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
              Vendor & Supply Chain
            </span>
            <Title level={2} style={{ margin: "2px 0 0", color: "#183c35" }}>
              Dealers & Suppliers Directory
            </Title>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Refresh
            </Button>
            {can("dealers:manage") && (
              <Button
                type="primary"
                icon={<PlusSquareOutlined />}
                onClick={handleOpenAdd}
                style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
              >
                Add New Dealer
              </Button>
            )}
          </Space>
        </div>

        {/* Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Registered Vendors"
                value={dealersData.length}
                prefix={<TeamOutlined style={{ color: "#183c35" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Search and Table */}
        <Card bordered={false} style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.05)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Input
              placeholder="Search vendors by name, shop, contact, or address..."
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ maxWidth: 400 }}
            />
          </div>

          {isError && (
            <Alert
              type="error"
              showIcon
              message="Failed to load dealers"
              action={<Button size="small" onClick={() => refetch()}>Retry</Button>}
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            columns={columns}
            dataSource={filteredDealers}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No dealers recorded" /> }}
          />
        </Card>

        {/* Add / Edit Dealer Modal */}
        <Modal
          title={editingDealer ? "Edit Dealer Information" : "Register New Supplier / Dealer"}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingDealer(null);
          }}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
          >
            <Form.Item
              label="Dealer / Company Name"
              name="dealerName"
              rules={[{ required: true, message: "Please enter dealer name" }]}
            >
              <Input placeholder="e.g. Atlas Sanitary Supplies" />
            </Form.Item>

            <Form.Item
              label="Contact Person / Phone Number"
              name="contactName"
              rules={[{ required: true, message: "Please enter contact person or phone" }]}
            >
              <Input placeholder="e.g. Mr. Tariq (0300-1234567)" />
            </Form.Item>

            <Form.Item
              label="Shop / Warehouse Name"
              name="shopName"
              rules={[{ required: true, message: "Please enter shop name" }]}
            >
              <Input placeholder="e.g. Shop #14, Hardware Market" />
            </Form.Item>

            <Form.Item
              label="Physical Address"
              name="address"
              rules={[{ required: true, message: "Please enter address" }]}
            >
              <Input placeholder="e.g. Commercial Plaza, Lahore" />
            </Form.Item>

            <Form.Item
              label="Supplied Products / Categories"
              name="products"
              extra="Comma-separated list (e.g. Pipes, Water Tanks, Fittings)"
            >
              <Input placeholder="e.g. CPVC Pipes, Taps, Tanks" />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={addDealer.isPending || editDealer.isPending}
                style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
              >
                {editingDealer ? "Save Changes" : "Register Dealer"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </DefaultLayout>
  );
}