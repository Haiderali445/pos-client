import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  CarryOutOutlined,
  CloudSyncOutlined,
  DashboardOutlined,
  DisconnectOutlined,
  DollarOutlined,
  FileTextOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import POSLogo from "../assets/svg/pos-logo.svg?url";
import useNetworkStatus from "../hooks/useNetworkStatus";
import "../styles/Defaultlayouts.css";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DefaultLayouts = ({ children }) => {
  const { cartItems } = useSelector((state) => state.rootReducer);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { isOnline, pendingCount, isSyncing, syncNow } = useNetworkStatus();

  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  const user = auth?.user || {};
  const userName = user.name || user.userId || "Store Operator";
  const userRole = (user.role || "cashier").toLowerCase();
  const isAdmin = userRole === "admin" || user.userId === "0" || user.userId === "admin";
  const isManagerOrAdmin = isAdmin || userRole === "manager";

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const cartUnitsCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cartItems]
  );

  // Group Label Helper
  const renderGroupLabel = (title) => {
    if (collapsed) return "—";
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "#d1e4d7",
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
    );
  };

  // Structured 3-Category Sidebar Navigation
  const menuItems = useMemo(() => {
    const categories = [];

    // Category 1: Sales & Terminal
    categories.push({
      key: "group-sales",
      label: renderGroupLabel("Sales & Terminal"),
      type: "group",
      children: [
        { key: "/", icon: <ShoppingCartOutlined />, label: "Point of Sale" },
        { key: "/bills", icon: <FileTextOutlined />, label: "Invoices & Receipts" },
        { key: "/items", icon: <CarryOutOutlined />, label: "Inventory Catalog" },
      ],
    });

    // Category 2: Operations & Analytics
    if (isManagerOrAdmin) {
      categories.push({
        key: "group-operations",
        label: renderGroupLabel("Operations & Analytics"),
        type: "group",
        children: [
          { key: "/stock", icon: <DashboardOutlined />, label: "Stock Analytics" },
          { key: "/dealers", icon: <TeamOutlined />, label: "Dealers & Vendors" },
          { key: "/charges", icon: <DollarOutlined />, label: "Store Expenses" },
        ],
      });
    }

    // Category 3: Administration
    if (isAdmin) {
      categories.push({
        key: "group-admin",
        label: renderGroupLabel("Administration"),
        type: "group",
        children: [
          { key: "/users", icon: <UserOutlined style={{ color: "#f2c14e" }} />, label: "User Management" },
          { key: "/settings", icon: <SettingOutlined style={{ color: "#52c41a" }} />, label: "Store Settings" },
        ],
      });
    }

    return categories;
  }, [collapsed, isAdmin, isManagerOrAdmin]);

  const profileMenuItems = useMemo(() => {
    const items = [
      {
        key: "user-info",
        label: (
          <div style={{ padding: "4px 2px" }}>
            <div style={{ fontWeight: 700, color: "#183c35" }}>{userName}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
              <Tag
                color={isAdmin ? "purple" : userRole === "manager" ? "blue" : "green"}
                style={{ margin: 0, fontSize: 10, lineHeight: "16px" }}
              >
                {(isAdmin ? "admin" : userRole).toUpperCase()}
              </Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>
                ID: {user.userId || "admin"}
              </Text>
            </div>
          </div>
        ),
        disabled: true,
      },
      { type: "divider" },
    ];

    if (isAdmin) {
      items.push(
        {
          key: "/users",
          icon: <UserOutlined style={{ color: "#183c35" }} />,
          label: "User Management",
        },
        {
          key: "/settings",
          icon: <SettingOutlined style={{ color: "#183c35" }} />,
          label: "Store Settings",
        },
        { type: "divider" }
      );
    }

    items.push(
      {
        key: "change-password",
        icon: <KeyOutlined />,
        label: "Change Password",
      },
      {
        key: "logout",
        icon: <LogoutOutlined style={{ color: "#cf1322" }} />,
        label: <span style={{ color: "#cf1322", fontWeight: 600 }}>Sign Out</span>,
      }
    );

    return items;
  }, [isAdmin, userName, userRole, user.userId]);

  const profileMenu = {
    items: profileMenuItems,
    onClick: ({ key }) => {
      if (key === "logout") {
        localStorage.removeItem("auth");
        navigate("/login", { replace: true });
      } else if (key === "change-password") {
        navigate("/ChangePasswordForm");
      } else if (key.startsWith("/")) {
        navigate(key);
      }
    },
  };

  const getPageTitle = (path) => {
    switch (path.toLowerCase()) {
      case "/":
        return "Point of Sale";
      case "/bills":
        return "Invoices & Receipts";
      case "/items":
        return "Inventory Catalog";
      case "/stock":
        return "Stock Analytics";
      case "/dealers":
        return "Dealers & Vendors";
      case "/charges":
        return "Operational Expenses";
      case "/users":
        return "User Management";
      case "/settings":
      case "/tenantsettings":
        return "Store Settings";
      case "/cart":
        return "Review Checkout";
      case "/changepasswordform":
        return "Security Settings";
      default:
        return "POS Terminal";
    }
  };

  const handleMenuClick = (key) => {
    if (key.startsWith("/")) {
      navigate(key);
      setMobileDrawerOpen(false);
    }
  };

  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isGlobalLoading = isFetching > 0 || isMutating > 0;

  return (
    <Layout className="app-shell">
      {isGlobalLoading && (
        <div
          className="global-progress-bar"
          role="progressbar"
          aria-label="Loading workspace data..."
        />
      )}
      {/* Desktop Navigation Sider */}
      <Sider
        width={240}
        collapsedWidth={72}
        collapsed={collapsed}
        className="app-sider desktop-sider"
      >
        {/* Top Brand Header with Integrated Collapse Toggle */}
        <div
          className="app-brand"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: collapsed ? "16px 12px" : "16px",
          }}
        >
          <div
            onClick={() => navigate("/")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              overflow: "hidden",
            }}
          >
            <img
              src={POSLogo}
              alt="Hardware Point"
              style={{ width: collapsed ? 32 : 36, height: "auto", flexShrink: 0 }}
            />
            {!collapsed && (
              <div>
                <strong style={{ display: "block", lineHeight: 1.2, color: "#fff", fontSize: 15 }}>
                  Hardware Point
                </strong>
                <div style={{ fontSize: 10, color: "#809c8c", fontWeight: 600 }}>
                  Enterprise POS
                </div>
              </div>
            )}
          </div>

          <Tooltip placement="right" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
  <Button
    type="text"
    size="small"
    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
    onClick={() => setCollapsed(!collapsed)}
    style={{
      color: "#809c8c",
      width: 28,
      height: 28,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
    }}
  />
</Tooltip>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[
            location.pathname.toLowerCase() === "/items" ? "/items" : location.pathname,
          ]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />

        <div className="sider-bottom" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
          <div className="sider-help" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className={`status-dot ${!isOnline ? "offline" : ""}`}
            />
            {!collapsed && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em" }}>
                {isOnline ? "Live Cloud Connected" : "Local Terminal Mode"}
              </span>
            )}
          </div>
        </div>
      </Sider>

      {/* Mobile Navigation Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0, backgroundColor: "#183c35" } }}
        width={260}
      >
        <div
          className="app-brand"
          style={{ padding: "20px 20px", display: "flex", alignItems: "center", gap: 12 }}
        >
          <img src={POSLogo} alt="Hardware Point" style={{ width: 36, height: "auto" }} />
          <div>
            <strong style={{ color: "#fff", display: "block", lineHeight: 1.2 }}>
              Hardware Point
            </strong>
            <div style={{ fontSize: 11, color: "#809c8c" }}>Mobile Terminal</div>
          </div>
        </div>
        <Menu
          mode="inline"
          theme="dark"
          style={{ backgroundColor: "transparent" }}
          selectedKeys={[
            location.pathname.toLowerCase() === "/items" ? "/items" : location.pathname,
          ]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Drawer>

      <Layout>
        {/* Header Bar */}
        <Header className="app-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              className="mobile-menu-toggle"
              type="text"
              icon={<MenuOutlined style={{ fontSize: 18, color: "#183c35" }} />}
              onClick={() => setMobileDrawerOpen(true)}
            />
            <div>
              <span className="header-kicker">Store Terminal #1</span>
              <h1 style={{ margin: 0, fontSize: 18, color: "#183c35", fontWeight: 800 }}>
                {getPageTitle(location.pathname)}
              </h1>
            </div>
          </div>

          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Sync Badge */}
            {!isOnline ? (
              <Tooltip title="Local offline terminal active. Checkouts stored safely in IndexedDB.">
                <span className="pos-live-badge offline">
                  <DisconnectOutlined />
                  <span>Offline Terminal</span>
                  {pendingCount > 0 && (
                    <Badge
                      count={pendingCount}
                      style={{ backgroundColor: "#d46b08", marginLeft: 2 }}
                    />
                  )}
                </span>
              </Tooltip>
            ) : isSyncing ? (
              <span className="pos-live-badge syncing">
                <SyncOutlined spin />
                <span>Syncing {pendingCount}...</span>
              </span>
            ) : pendingCount > 0 ? (
              <Tooltip title="Click to synchronize offline sales with MongoDB cloud database">
                <Button
                  size="small"
                  type="dashed"
                  icon={<CloudSyncOutlined />}
                  onClick={syncNow}
                  style={{
                    borderColor: "#faad14",
                    color: "#d46b08",
                    fontWeight: 700,
                    borderRadius: 6,
                    backgroundColor: "#fffbe6",
                  }}
                >
                  Sync ({pendingCount})
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Connected to cloud MongoDB database. Local cache synchronized.">
                <span className="pos-live-badge online desktop-status-tag">
                  <span className="status-dot" /> Live Online
                </span>
              </Tooltip>
            )}

            {/* Cart Counter */}
            <Tooltip title="Review Basket">
              <Badge
                count={cartUnitsCount}
                size="small"
                offset={[-2, 2]}
                style={{ backgroundColor: "#f2c14e", color: "#183c35", fontWeight: 800 }}
              >
                <Button
                  type="text"
                  icon={<ShoppingCartOutlined style={{ fontSize: 20, color: "#183c35" }} />}
                  onClick={() => navigate("/cart")}
                  style={{ borderRadius: 8, backgroundColor: "#f4f8f5", border: "1px solid #dfe8e1" }}
                />
              </Badge>
            </Tooltip>

            {/* Profile Menu Dropdown */}
            <Dropdown menu={profileMenu} trigger={["click"]} placement="bottomRight">
              <Button type="text" style={{ height: "auto", padding: "4px 6px", borderRadius: 8 }}>
                <Space size={8}>
                  <Avatar
                    size={32}
                    style={{
                      backgroundColor: isAdmin ? "#183c35" : "#22614e",
                      color: "#f2c14e",
                      fontWeight: 700,
                    }}
                  >
                    {userName.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <span
                    className="header-username"
                    style={{ fontWeight: 700, color: "#183c35", fontSize: 13 }}
                  >
                    {userName}
                  </span>
                </Space>
              </Button>
            </Dropdown>
          </div>
        </Header>

        {/* Dynamic Route Workspace */}
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayouts;