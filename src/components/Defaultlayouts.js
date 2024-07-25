import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { Layout, Menu } from "antd";
import { DollarCircleOutlined, MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined, LogoutOutlined, HomeOutlined, CopyOutlined, UnorderedListOutlined, InboxOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import logo from '../images/logo.jpg'; 
import "../styles/Defaultlayouts.css";

const { Header, Sider, Content } = Layout;

const DefaultLayouts = ({ children }) => {
  const { cartItems } = useSelector(state => state.rootReducer);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  
  const toggle = () => {
    setCollapsed(!collapsed);
  };
  
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        {React.createElement(
          collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
          {
            className: "trigger",
            onClick: toggle,
            style: { color: "white", paddingLeft: "10" }
          }
        )}
        <div className="logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0' }}>
          <img src={logo} alt="Logo" style={{ width: "80%", height: "auto" }} /> 
        </div>
        <Menu
          theme="dark"
         
          defaultSelectedKeys={[window.location.pathname]}
        >
          <Menu.Item key="/" icon={<HomeOutlined />}>
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="/bills" icon={<CopyOutlined />}>
            <Link to="/bills">Bills</Link>
          </Menu.Item>
          <Menu.Item key="/items" icon={<UnorderedListOutlined />}>
            <Link to="/Items">Items</Link>
          </Menu.Item>
          <Menu.Item key="/stock" icon={<InboxOutlined />}>
            <Link to="/stock">Stock</Link>
          </Menu.Item>
          <Menu.Item key="/Dealers" icon={<UserOutlined />}>
            <Link to="/Dealers">Dealers</Link>
          </Menu.Item>
          <Menu.Item key="/charges" icon={<DollarCircleOutlined />}>
            <Link to="/Charges">Charges</Link>
          </Menu.Item>
          <Menu.Item key="/logout" 
            icon={<LogoutOutlined />}
            onClick={() => {
              localStorage.removeItem('auth');
              navigate('/login');
            }}  >
            Logout
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout">
      <Header className="site-layout-background bg-light" style={{ padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: "#1890ff", textAlign: "center", fontWeight: "bolder", fontSize: "larger" }}>
    <h2>HARDWARE POINT OF SALE</h2>
</Header>
        <Content
          className="site-layout-background"
          style={{
            margin: "10px 13px",
            padding: 10,
            minHeight: 100,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayouts;
