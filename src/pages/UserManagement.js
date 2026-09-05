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
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  KeyOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import DefaultLayout from "../components/Defaultlayouts";
import { useUserMutations, useUsers } from "../hooks/usePosQueries";
import { format, isValid } from "date-fns";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function UserManagement() {
  const { data: users = [], isLoading, isError, refetch } = useUsers();
  const { createUser, toggleStatus, updateRole, deleteUser } = useUserMutations();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState(null);
  const [form] = Form.useForm();

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.active !== false).length;
    const inactive = total - active;
    const admins = users.filter((u) => u.role === "admin").length;
    const cashiers = users.filter((u) => u.role === "cashier" || !u.role).length;
    return { total, active, inactive, admins, cashiers };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.userId && u.userId.toLowerCase().includes(search.toLowerCase()));
      const matchRole = roleFilter === "all" || (u.role || "cashier") === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  // Handle Add User Form Submission
  const handleCreateUser = async (values) => {
    try {
      const res = await createUser.mutateAsync(values);
      message.success("New operator account provisioned!");
      setIsAddModalVisible(false);
      form.resetFields();
      setCreatedCredentialsModal({
        name: values.name,
        userId: res.user?.userId || values.userId,
        password: values.password,
        role: values.role || "cashier",
      });
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to create user account.");
    }
  };

  // Toggle active status
  const handleToggleStatus = async (user, checked) => {
    try {
      await toggleStatus.mutateAsync({ userId: user.userId, active: checked });
      message.success(`User ${user.name} is now ${checked ? "active" : "inactive"}`);
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to update user status.");
    }
  };

  // Update role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      message.success(`Updated role for ${userId} to ${newRole}`);
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to change user role.");
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser.mutateAsync(userId);
      message.success("User removed successfully.");
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to remove user.");
    }
  };

  // Generate random password helper
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setFieldsValue({ password: pass });
  };

  const columns = [
    {
      title: "Operator",
      key: "operator",
      render: (_, record) => (
        <Space size={12}>
          <Avatar
            style={{
              backgroundColor: record.role === "admin" ? "#183c35" : record.role === "manager" ? "#22614e" : "#e3b341",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {record.name ? record.name.slice(0, 1).toUpperCase() : "U"}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: "#183c35" }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: <Text code>{record.userId}</Text>
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "System Role",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <Select
          value={role || "cashier"}
          size="small"
          style={{ width: 115 }}
          onChange={(newRole) => handleRoleChange(record.userId, newRole)}
          disabled={record.userId === "admin"}
        >
          <Option value="admin">
            <Tag color="purple">Admin</Tag>
          </Option>
          <Option value="manager">
            <Tag color="blue">Manager</Tag>
          </Option>
          <Option value="cashier">
            <Tag color="green">Cashier</Tag>
          </Option>
        </Select>
      ),
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active, record) => (
        <Space size={8}>
          <Switch
            checked={active !== false}
            size="small"
            disabled={record.userId === "admin"}
            onChange={(checked) => handleToggleStatus(record, checked)}
          />
          <Text style={{ fontSize: 12 }} type={active !== false ? "success" : "danger"}>
            {active !== false ? "Active" : "Inactive"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Created On",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => {
        if (!date) return "—";
        const d = new Date(date);
        return isValid(d) ? format(d, "dd MMM yyyy, HH:mm") : "—";
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        if (record.userId === "admin") {
          return (
            <Tooltip title="Master admin account cannot be deleted">
              <Tag icon={<SafetyCertificateOutlined />} color="gold">
                Protected
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Popconfirm
            title="Delete user account?"
            description={`Are you sure you want to remove ${record.name}?`}
            onConfirm={() => handleDeleteUser(record.userId)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b9991", fontWeight: 700 }}>
              Administration & Security
            </span>
            <Title level={2} style={{ margin: "2px 0 0", color: "#183c35" }}>
              User Management
            </Title>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => {
                form.resetFields();
                setIsAddModalVisible(true);
              }}
              style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
            >
              Add New Operator
            </Button>
          </Space>
        </div>

        {/* Stats Overview Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Total Operators"
                value={stats.total}
                prefix={<TeamOutlined style={{ color: "#183c35" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Active Accounts"
                value={stats.active}
                valueStyle={{ color: "#2d8a55" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Inactive / Suspended"
                value={stats.inactive}
                valueStyle={{ color: stats.inactive > 0 ? "#cf1322" : "#8c8c8c" }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ boxShadow: "0 2px 12px rgba(24,60,53,0.04)", borderRadius: 10 }}>
              <Statistic
                title="Store Cashiers"
                value={stats.cashiers}
                prefix={<UserSwitchOutlined style={{ color: "#e3b341" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card bordered={false} style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.05)", borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
            <Input
              placeholder="Search by operator name or User ID..."
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ maxWidth: 360 }}
            />
            <Space>
              <Text style={{ fontSize: 13, color: "#666" }}>Filter Role:</Text>
              <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 130 }}>
                <Option value="all">All Roles</Option>
                <Option value="admin">Admin</Option>
                <Option value="manager">Manager</Option>
                <Option value="cashier">Cashier</Option>
              </Select>
            </Space>
          </div>

          {isError && (
            <Alert
              type="error"
              showIcon
              message="Failed to load user accounts"
              description="Could not connect to the authentication service."
              action={<Button size="small" onClick={() => refetch()}>Retry</Button>}
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No operators found" /> }}
          />
        </Card>
      </div>

      {/* Add Operator Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserAddOutlined style={{ color: "#183c35" }} />
            <span>Provision New Store Operator</span>
          </div>
        }
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
          initialValues={{ role: "cashier", active: true }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[
              { required: true, message: "Please enter the operator full name" },
              { min: 2, message: "Name must be at least 2 characters" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="e.g. John Doe" />
          </Form.Item>

          <Form.Item
            name="userId"
            label="Custom User ID (Optional)"
            extra="Leave blank to automatically generate sequence ID (e.g. 1002)"
          >
            <Input prefix={<KeyOutlined />} placeholder="e.g. cashier_john (lowercase)" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please assign a password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter strong password"
              addonAfter={
                <Button type="link" size="small" onClick={generateRandomPassword}>
                  Auto-generate
                </Button>
              }
            />
          </Form.Item>

          <Form.Item name="role" label="Assign System Role" rules={[{ required: true }]}>
            <Select>
              <Option value="cashier">Cashier (Point of Sale, Invoices, Inventory View)</Option>
              <Option value="manager">Manager (POS, Stock Management, Expenses, Reports)</Option>
              <Option value="admin">Master Administrator (Full Access + User Management)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="active" label="Initial Account Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Disabled" defaultChecked />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
            <Button onClick={() => setIsAddModalVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createUser.isPending}
              style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
            >
              Provision Account
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Account Provisioned Success Credentials Modal */}
      <Modal
        title={<Tag color="success" style={{ fontSize: 14, padding: "4px 8px" }}>Account Created Successfully</Tag>}
        open={Boolean(createdCredentialsModal)}
        onOk={() => setCreatedCredentialsModal(null)}
        onCancel={() => setCreatedCredentialsModal(null)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setCreatedCredentialsModal(null)}>
            Done
          </Button>,
        ]}
      >
        <Paragraph>Please securely share these credentials with the store operator:</Paragraph>
        <Card size="small" style={{ backgroundColor: "#f6f8f6", borderColor: "#dbe4dd", marginBottom: 16 }}>
          <p style={{ margin: "4px 0" }}>
            <strong>Operator:</strong> {createdCredentialsModal?.name}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>User ID:</strong> <Text code copyable>{createdCredentialsModal?.userId}</Text>
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Password:</strong> <Text code copyable>{createdCredentialsModal?.password}</Text>
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Role:</strong> <Tag color="blue">{createdCredentialsModal?.role}</Tag>
          </p>
        </Card>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Note: Passwords can be changed later using the Change Password feature.
        </Text>
      </Modal>
    </DefaultLayout>
  );
}
