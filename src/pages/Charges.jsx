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
  Space,
  Statistic,
  Table,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { format, isValid } from "date-fns";
import DefaultLayout from "../components/Defaultlayouts";
import { useChargeMutations, useCharges } from "../hooks/usePosQueries";
import usePermission from "../hooks/usePermission";

const { Title } = Typography;

export default function ChargesPage() {
  const { can } = usePermission();
  const { data: chargesData = [], isLoading, isError, refetch } = useCharges();
  const { addCharge, editCharge, deleteCharge } = useChargeMutations();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  const totalAmount = useMemo(() => {
    return chargesData.reduce((acc, charge) => acc + (Number(charge.amount) || 0), 0);
  }, [chargesData]);

  const filteredCharges = useMemo(() => {
    return chargesData.filter((c) => {
      const matchSearch =
        (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });
  }, [chargesData, search]);

  const handleOpenAdd = () => {
    setEditingCharge(null);
    form.resetFields();
    form.setFieldsValue({
      date: new Date().toISOString().slice(0, 10),
    });
    setIsModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingCharge(record);
    form.setFieldsValue({
      description: record.description,
      amount: record.amount,
      date: record.date ? new Date(record.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setIsModalVisible(true);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingCharge) {
        await editCharge.mutateAsync({
          ...values,
          chargeId: editingCharge._id,
        });
        message.success("Expense record updated!");
      } else {
        await addCharge.mutateAsync(values);
        message.success("New operational expense logged!");
      }
      setIsModalVisible(false);
      setEditingCharge(null);
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to save expense record.");
    }
  };

  const handleDelete = async (charge) => {
    try {
      await deleteCharge.mutateAsync(charge._id);
      message.success("Expense record deleted.");
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to delete expense record.");
    }
  };

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc) => <strong style={{ color: "#183c35" }}>{desc}</strong>,
    },
    {
      title: "Date Incurred",
      dataIndex: "date",
      key: "date",
      render: (date) => {
        if (!date) return "—";
        const d = new Date(date);
        return isValid(d) ? format(d, "dd MMM yyyy") : "—";
      },
    },
    {
      title: "Amount (PKR)",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <span style={{ fontWeight: 700, color: "#cf1322" }}>
          PKR {Number(amount || 0).toFixed(2)}
        </span>
      ),
    },
    ...(can("expenses:manage")
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space size={8}>
                <Tooltip title="Edit Expense">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenEdit(record)}
                  />
                </Tooltip>
                <Popconfirm
                  title="Delete this expense record?"
                  description="Are you sure you want to remove this charge?"
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
      <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
        {/* Heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b9991", fontWeight: 700 }}>
              Operating Overheads
            </span>
            <Title level={2} style={{ margin: "2px 0 0", color: "#183c35" }}>
              Store Expenses & Operational Charges
            </Title>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              Refresh
            </Button>
            {can("expenses:manage") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenAdd}
                style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
              >
                Log New Expense
              </Button>
            )}
          </Space>
        </div>

        {/* Top Accent Stat Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card
              bordered={false}
              style={{
                boxShadow: "0 4px 16px rgba(24,60,53,0.06)",
                borderRadius: 12,
                borderTop: "3px solid #cf1322",
                background: "#ffffff",
              }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#cf1322", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Total Expenses
                  </span>
                }
                value={`PKR ${totalAmount.toFixed(2)}`}
                valueStyle={{ color: "#cf1322", fontWeight: 800, fontSize: 22 }}
                prefix={<WalletOutlined style={{ color: "#cf1322", marginRight: 4 }} />}
              />
            </Card>
          </Col>

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
                title={
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#183c35", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Recorded Entries
                  </span>
                }
                value={chargesData.length}
                valueStyle={{ color: "#183c35", fontWeight: 800, fontSize: 22 }}
                prefix={<CalendarOutlined style={{ color: "#183c35", marginRight: 4 }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filter and Table */}
        <Card bordered={false} style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.05)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Input
              placeholder="Search expenses by description..."
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ maxWidth: 360 }}
            />
          </div>

          {isError && (
            <Alert
              type="error"
              showIcon
              message="Failed to load expense records"
              action={<Button size="small" onClick={() => refetch()}>Retry</Button>}
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            columns={columns}
            dataSource={filteredCharges}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No expense records logged" /> }}
            footer={() => (
              <div style={{ display: "flex", justifyContent: "flex-end", fontWeight: 700, color: "#183c35" }}>
                <span>Total Expenses: PKR {totalAmount.toFixed(2)}</span>
              </div>
            )}
          />
        </Card>

        {/* Modal */}
        <Modal
          title={editingCharge ? "Edit Expense Entry" : "Log New Store Expense"}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingCharge(null);
          }}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item
              label="Expense Description"
              name="description"
              rules={[{ required: true, message: "Please describe the expense" }]}
            >
              <Input placeholder="e.g. Electricity bill, Staff tea, Freight delivery" />
            </Form.Item>

            <Form.Item
              label="Date Incurred"
              name="date"
              rules={[{ required: true, message: "Please enter date" }]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: "Please specify amount" }]}
            >
              <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="0.00" />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={addCharge.isPending || editCharge.isPending}
                style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
              >
                {editingCharge ? "Save Changes" : "Log Expense"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </DefaultLayout>
  );
}