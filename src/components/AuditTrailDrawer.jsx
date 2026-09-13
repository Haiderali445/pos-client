import React, { useState } from "react";
import {
  Badge,
  Button,
  Drawer,
  Empty,
  Popconfirm,
  Spin,
  Table,
  Tag,
  Tabs,
  Typography,
  message,
} from "antd";
import {
  AuditOutlined,
  DeleteOutlined,
  StopOutlined,
  ReloadOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import { format, isValid } from "date-fns";

const { Text } = Typography;

// Safely unwrap data arrays regardless of whether backend returns [...] or { data: [...] }
function extractArrayData(res) {
  if (!res) return [];
  const payload = res.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.voidedBills)) return payload.voidedBills;
    if (Array.isArray(payload.deletedItems)) return payload.deletedItems;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
  }
  return [];
}

async function fetchVoidedBills() {
  const res = await apiClient.get("/bill/voided");
  return extractArrayData(res);
}

async function fetchDeletedItems() {
  const res = await apiClient.get("/items/deleted");
  return extractArrayData(res);
}

export default function AuditTrailDrawer({ open, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("voided");

  const {
    data: voidedBills = [],
    isLoading: loadingBills,
    refetch: refetchBills,
    isFetching: fetchingBills,
  } = useQuery({
    queryKey: ["voidedBills"],
    queryFn: fetchVoidedBills,
    enabled: Boolean(open),
    staleTime: 1000 * 30,
  });

  const {
    data: deletedItems = [],
    isLoading: loadingItems,
    refetch: refetchItems,
    isFetching: fetchingItems,
  } = useQuery({
    queryKey: ["deletedItems"],
    queryFn: fetchDeletedItems,
    enabled: Boolean(open),
    staleTime: 1000 * 30,
  });

  const handleRefresh = () => {
    refetchBills();
    refetchItems();
  };

  // Restore API Handlers
  const handleRestoreBill = async (id) => {
    try {
      await apiClient.post(`/bill/restore/${id}`);
      message.success("Invoice restored successfully!");
      refetchBills();
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    } catch (err) {
      message.error(err.response?.data?.error || "Failed to restore invoice");
    }
  };

  const handleRestoreItem = async (id) => {
    try {
      await apiClient.post(`/items/restore/${id}`);
      message.success("Product restored to catalog!");
      refetchItems();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      message.error(err.response?.data?.error || "Failed to restore product");
    }
  };

  // Renders User details safely whether string ID or populated object
  const renderUser = (user, color = "blue") => {
    if (!user) return <Tag color="default">System</Tag>;
    if (typeof user === "object") {
      const displayName = user.name || user.username || user.email || "User";
      return <Tag color={color}>{displayName}</Tag>;
    }
    return <Tag color={color}>{String(user)}</Tag>;
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isValid(dt) ? format(dt, "dd MMM yyyy, HH:mm") : "—";
  };

  const fmtCurrency = (n) => `PKR ${Number(n || 0).toFixed(2)}`;

  const voidedColumns = [
    {
      title: "Invoice #",
      dataIndex: "_id",
      key: "_id",
      render: (id) => (
        <Text code style={{ fontWeight: 700, color: "#183c35" }}>
          {String(id || "").slice(-8).toUpperCase()}
        </Text>
      ),
    },
    {
      title: "Customer",
      dataIndex: "costumerName",
      key: "costumerName",
      render: (n) => n || "Walk-in Customer",
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (n) => <strong>{fmtCurrency(n)}</strong>,
    },
    {
      title: "Voided By",
      dataIndex: "deletedBy",
      key: "deletedBy",
      render: (v) => renderUser(v, "volcano"),
    },
    {
      title: "Voided At",
      dataIndex: "deletedAt",
      key: "deletedAt",
      render: (d) => fmtDate(d),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Restore Invoice?"
          description="Re-activates invoice record and re-deducts item quantities."
          onConfirm={() => handleRestoreBill(record._id)}
          okText="Restore"
          cancelText="Cancel"
        >
          <Button size="small" icon={<UndoOutlined />} style={{ color: "#183c35", borderColor: "#183c35" }}>
            Restore
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const deletedItemColumns = [
    {
      title: "Item Name",
      dataIndex: "name",
      key: "name",
      render: (n, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "#183c35" }}>{n}</div>
          {r.sku && <Text type="secondary" style={{ fontSize: 11 }}>SKU: {r.sku}</Text>}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (c) => <Tag color="geekblue">{c || "General"}</Tag>,
    },
    {
      title: "Deleted By",
      dataIndex: "deletedBy",
      key: "deletedBy",
      render: (v) => renderUser(v, "orange"),
    },
    {
      title: "Deleted At",
      dataIndex: "deletedAt",
      key: "deletedAt",
      render: (d) => fmtDate(d),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Restore Product?"
          description="Restores product visibility in active store catalog."
          onConfirm={() => handleRestoreItem(record._id)}
          okText="Restore"
          cancelText="Cancel"
        >
          <Button size="small" icon={<UndoOutlined />} style={{ color: "#183c35", borderColor: "#183c35" }}>
            Restore
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    {
      key: "voided",
      label: (
        <span>
          <StopOutlined style={{ marginRight: 6 }} />
          Voided Invoices
          {voidedBills.length > 0 && (
            <Badge count={voidedBills.length} style={{ marginLeft: 8, backgroundColor: "#cf1322" }} />
          )}
        </span>
      ),
      children: (
        <Spin spinning={loadingBills || fetchingBills}>
          <Table
            columns={voidedColumns}
            dataSource={voidedBills}
            rowKey={(r) => r._id || r.id || Math.random()}
            size="small"
            pagination={{ pageSize: 8 }}
            locale={{ emptyText: <Empty description="No voided invoices found" /> }}
          />
        </Spin>
      ),
    },
    {
      key: "deleted",
      label: (
        <span>
          <DeleteOutlined style={{ marginRight: 6 }} />
          Deleted Items
          {deletedItems.length > 0 && (
            <Badge count={deletedItems.length} style={{ marginLeft: 8, backgroundColor: "#d46b08" }} />
          )}
        </span>
      ),
      children: (
        <Spin spinning={loadingItems || fetchingItems}>
          <Table
            columns={deletedItemColumns}
            dataSource={deletedItems}
            rowKey={(r) => r._id || r.id || Math.random()}
            size="small"
            pagination={{ pageSize: 8 }}
            locale={{ emptyText: <Empty description="No deleted items found" /> }}
          />
        </Spin>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AuditOutlined style={{ color: "#183c35" }} />
          <span style={{ fontWeight: 700, color: "#183c35" }}>Audit Trail Log</span>
          <Tag color="purple" style={{ fontSize: 10 }}>Manager + Admin</Tag>
        </span>
      }
      placement="right"
      width={780}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 12 } }}
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={fetchingBills || fetchingItems}
        >
          Refresh Log
        </Button>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Drawer>
  );
}