import React, { useState } from "react";
import { Alert, Button, Form, Input, Modal, message } from "antd";
import { ArrowRightOutlined, KeyOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import "../styles/Auth.css";

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState("");
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.post("/users/login", {
        userId: values.userId.trim(),
        password: values.password,
      });

      const token = response.data?.token || response.headers["x-auth-token"];
      const rawUser = response.data?.user || {};
      const normalizedUserId = (rawUser.userId || values.userId.trim()).toLowerCase();
      const user = {
        _id: rawUser._id,
        userId: normalizedUserId,
        name: rawUser.name || (normalizedUserId === "admin" || normalizedUserId === "0" ? "haider" : normalizedUserId),
        role: (rawUser.role || (normalizedUserId === "admin" || normalizedUserId === "0" ? "admin" : "cashier")).toLowerCase(),
        active: rawUser.active !== false,
      };

      localStorage.setItem(
        "auth",
        JSON.stringify({
          authenticated: true,
          token,
          user,
        })
      );

      message.success(`Welcome back, ${user.name}!`);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.error;
      setError(
        errMsg ||
          (status === 401
            ? "Invalid user ID or password."
            : status >= 500
            ? "POS server configuration error. Contact administrator."
            : "Unable to connect to the POS backend server.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values) => {
    try {
      setLoading(true);
      const response = await apiClient.post("/users/reset-password", values);

      if (response.status === 200) {
        message.success("Password has been reset successfully. You can now sign in.");
        setResetOpen(false);
        resetForm.resetFields();
      }
    } catch (err) {
      message.error(err.response?.data?.error || "Failed to reset password. Verify User ID and name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--brand">
        <div className="brand-mark">HP</div>
        <p className="eyebrow">Enterprise POS Platform</p>
        <h1>Every sale,<br />under control.</h1>
        <p className="auth-copy">
          A high-performance command center for inventory, rapid barcode checkout, and real-time store analytics.
        </p>
        <div className="auth-status">
          <span /> Systems operational
        </div>
      </section>

      <section className="auth-panel auth-panel--form">
        <div className="auth-form-wrap">
          <p className="eyebrow">Terminal Access</p>
          <h2>Sign in to Counter</h2>
          <p className="muted">Use your operator credentials to access the POS terminal.</p>

          {error && <Alert className="auth-alert" type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="userId"
              label="User ID"
              rules={[{ required: true, message: "Enter your User ID" }]}
            >
              <Input
                size="large"
                prefix={<UserOutlined style={{ color: "#8c8c8c" }} />}
                placeholder="e.g. admin or 1001"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Enter your password" }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: "#8c8c8c" }} />}
                placeholder="Your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Button type="link" className="auth-link" style={{ padding: 0 }} onClick={() => setResetOpen(true)}>
                Forgot password?
              </Button>
            </div>

            <Button
              block
              size="large"
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={!loading && <ArrowRightOutlined />}
              style={{
                backgroundColor: "#183c35",
                borderColor: "#183c35",
                height: 48,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Enter Workspace
            </Button>
          </Form>

          <p className="auth-footer" style={{ marginTop: 24, textAlign: "center", color: "#666" }}>
            New cashier / operator? <Link to="/registration" style={{ color: "#183c35", fontWeight: 700 }}>Self Register</Link>
          </p>
        </div>
      </section>

      {/* Forgot Password Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeyOutlined style={{ color: "#183c35" }} />
            <span>Reset Forgotten Password</span>
          </div>
        }
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={loading}
            onClick={() => resetForm.submit()}
            style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
          >
            Update Password
          </Button>,
        ]}
      >
        <Form form={resetForm} layout="vertical" onFinish={handleForgotPassword}>
          <Form.Item
            name="userId"
            label="User ID"
            rules={[{ required: true, message: "Enter your User ID" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="e.g. admin or 1001" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Registered Full Name"
            rules={[{ required: true, message: "Enter your registered name" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="e.g. John Doe" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "Enter your new password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
};

export default LoginForm;
