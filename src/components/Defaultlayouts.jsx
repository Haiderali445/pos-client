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
  DollarOutlined,
  FileTextOutlined,
  CloudSyncOutlined,
  DisconnectOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import POSLogo from "../Assests/svg/pos-logo.svg?react";
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
  const userRole = (user.role || (user.userId === "admin" ? "admin" : "cashier")).toLowerCase();
  const isAdmin = userRole === "admin" || user.userId === "admin" || auth?.role === "admin";

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const menuItems = useMemo(() => {
    const items = [
      { key: "/", icon: <ShoppingCartOutlined />, label: "Point of Sale" },
      { key: "/bills", icon: <FileTextOutlined />, label: "Invoices & Receipts" },
      { key: "/items", icon: <CarryOutOutlined />, label: "Inventory Catalog" },
      { key: "/stock", icon: <BarChartOutlined />, label: "Stock Analytics" },
      { key: "/dealers", icon: <TeamOutlined />, label: "Dealers & Vendors" },
      { key: "/charges", icon: <DollarOutlined />, label: "Store Expenses" },
    ];

    if (isAdmin) {
      items.push({
        key: "/users",
        icon: <SafetyCertificateOutlined style={{ color: "#f2c14e" }} />,
        label: "User Management",
      });
    }

    return items;
  }, [isAdmin]);

  const profileMenuItems = useMemo(() => {
    const items = [
      {
        key: "user-info",
        label: (
          <div style={{ padding: "4px 0" }}>
            <div style={{ fontWeight: 700, color: "#183c35" }}>{userName}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
              <Tag color={isAdmin ? "purple" : userRole === "manager" ? "blue" : "green"} style={{ margin: 0, fontSize: 11 }}>
                {(isAdmin ? "admin" : userRole).toUpperCase()}
              </Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>ID: {user.userId || "admin"}</Text>
            </div>
          </div>
        ),
        disabled: true,
      },
      { type: "divider" },
    ];

    if (isAdmin) {
      items.push({
        key: "user-mgmt",
        icon: <SafetyCertificateOutlined style={{ color: "#183c35" }} />,
        label: "User Management",
      });
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
        label: <span style={{ color: "#cf1322" }}>Sign Out</span>,
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
      } else if (key === "user-mgmt") {
        navigate("/users");
      }
    },
  };

  const getPageTitle = (path) => {
    switch (path) {
      case "/":
        return "Point of Sale";
      case "/bills":
        return "Invoices & Bills";
      case "/items":
      case "/Items":
        return "Inventory Management";
      case "/stock":
        return "Stock & Sales Analytics";
      case "/dealers":
        return "Dealer Directory";
      case "/charges":
        return "Operational Expenses";
      case "/users":
        return "User & Operator Management";
      case "/cart":
        return "Review Sale / Checkout";
      case "/ChangePasswordForm":
      case "/change-password":
        return "Security Settings";
      default:
        return "POS Workspace";
    }
  };

  const handleMenuClick = (key) => {
    navigate(key);
    setMobileDrawerOpen(false);
  };

  return (
    <Layout className="app-shell">
      {/* Desktop Sider */}
      <Sider
        width={250}
        collapsedWidth={76}
        collapsed={collapsed}
        className="app-sider desktop-sider"
      >
        <div 
          className="app-brand" 
          onClick={() => navigate("/")} 
          style={{ 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: 12, 
            padding: collapsed ? "16px 12px" : "16px",
            justifyContent: collapsed ? "center" : "flex-start" 
          }}
        >
          <POSLogo style={{ width: collapsed ? 32 : 36, height: "auto", flexShrink: 0 }} />
          {!collapsed && (
            <div>
              <strong style={{ display: "block", lineHeight: 1.2, whiteSpace: "nowrap" }}>Hardware Point</strong>
              <div style={{ fontSize: 10, color: "#809c8c", fontWeight: 500 }}>Enterprise POS</div>
            </div>
          )}
        </div>
        <div className="sider-label">{!collapsed ? "Workspace" : "—"}</div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname.toLowerCase() === "/items" ? "/items" : location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
        <div className="sider-bottom">
          {!collapsed && (
            <div className="sider-help" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                className="status-dot"
                style={{ backgroundColor: isOnline ? "#52c41a" : "#faad14" }}
              />
              <span>{isOnline ? "Live Cloud Connected" : "Local Terminal Mode"}</span>
            </div>
          )}
          <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </Tooltip>
        </div>
      </Sider>

      {/* Mobile Navigation Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        bodyStyle={{ padding: 0, backgroundColor: "#183c35" }}
        width={270}
      >
        <div className="app-brand" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <POSLogo style={{ width: 40, height: "auto" }} />
          <div>
            <strong style={{ color: "#fff", display: "block", lineHeight: 1.2 }}>Hardware Point</strong>
            <div style={{ fontSize: 11, color: "#809c8c" }}>Mobile Terminal</div>
          </div>
        </div>
        <div className="sider-label">Navigation</div>
        <Menu
          mode="inline"
          theme="dark"
          style={{ backgroundColor: "transparent" }}
          selectedKeys={[location.pathname.toLowerCase() === "/items" ? "/items" : location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Drawer>

      <Layout>
        {/* Top Header */}
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
              <h1>{getPageTitle(location.pathname)}</h1>
            </div>
          </div>

          <div className="header-actions">
            {isAdmin && (
              <Button
                type="primary"
                size="small"
                icon={<SafetyCertificateOutlined />}
                onClick={() => navigate("/users")}
                style={{
                  backgroundColor: location.pathname === "/users" ? "#f2c14e" : "#183c35",
                  color: location.pathname === "/users" ? "#183c35" : "#f2c14e",
                  borderColor: "#183c35",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                User Management
              </Button>
            )}

            {!isOnline ? (
              <Tooltip title="Local offline terminal active. All catalog searches and checkouts run locally in IndexedDB.">
                <Tag
                  color="warning"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    margin: 0,
                    borderRadius: 6,
                  }}
                >
                  <DisconnectOutlined />
                  <span>Offline (Local Terminal)</span>
                  {pendingCount > 0 && (
                    <Badge
                      count={pendingCount}
                      style={{ backgroundColor: "#d46b08", marginLeft: 4 }}
                    />
                  )}
                </Tag>
              </Tooltip>
            ) : isSyncing ? (
              <Tag
                color="processing"
                icon={<SyncOutlined spin />}
                style={{ fontWeight: 600, margin: 0, borderRadius: 6 }}
              >
                Syncing {pendingCount} offline sale{pendingCount > 1 ? "s" : ""}...
              </Tag>
            ) : pendingCount > 0 ? (
              <Tooltip title="Click to synchronize offline transactions with cloud MongoDB now">
                <Button
                  size="small"
                  type="dashed"
                  icon={<CloudSyncOutlined />}
                  onClick={syncNow}
                  style={{
                    borderColor: "#faad14",
                    color: "#d46b08",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Sync {pendingCount} Offline Sale{pendingCount > 1 ? "s" : ""}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Connected to cloud MongoDB database. Local IndexedDB mirror active.">
                <Tag
                  color="success"
                  className="desktop-status-tag"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <span className="status-dot" /> Live Online
                </Tag>
              </Tooltip>
            )}

            <Tooltip title="Review Basket">
              <Badge count={cartItems.reduce((sum, item) => sum + item.quantity, 0)} size="small">
                <Button
                  type="text"
                  icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />}
                  onClick={() => navigate("/cart")}
                />
              </Badge>
            </Tooltip>

            <Dropdown menu={profileMenu} trigger={["click"]} placement="bottomRight">
              <Button type="text" style={{ height: "auto", padding: "4px 8px" }}>
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
                  <span className="header-username">{userName}</span>
                </Space>
              </Button>
            </Dropdown>
          </div>
        </Header>

        {/* Page Content */}
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayouts;