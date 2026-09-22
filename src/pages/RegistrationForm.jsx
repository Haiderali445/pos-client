import React, { useState } from "react";
import { Alert, Button, Form, Input, Modal } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import "../styles/Auth.css";


const RegistrationForm = () => {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState(null);
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.post("/users/register", values);
      setCreatedUser(data.user);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (err.response?.status === 409
            ? "That user ID or name is already in use."
            : "Unable to create the operator account.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell auth-shell--single">
      <section className="auth-panel auth-panel--form">
        <div className="auth-form-wrap">
          <div className="brand-mark brand-mark--small">HP</div>
          <p className="eyebrow">Operator provisioning</p>
          <h2>Create a cashier account</h2>
          <p className="muted">Set up access for a trusted member of your store team.</p>
          {error && <Alert className="auth-alert" type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[
                { required: true, message: "Enter operator full name" },
                { min: 2, message: "Name must be at least 2 characters" },
              ]}
            >
              <Input size="large" prefix={<UserOutlined style={{ color: "#8c8c8c" }} />} placeholder="e.g. John Doe" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Enter a secure password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password size="large" prefix={<LockOutlined style={{ color: "#8c8c8c" }} />} placeholder="Enter password" />
            </Form.Item>
            <Button
              block
              size="large"
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                backgroundColor: "#183c35",
                borderColor: "#183c35",
                height: 48,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Register Cashier
            </Button>
          </Form>
          <p className="auth-footer" style={{ marginTop: 24, textAlign: "center", color: "#666" }}>
            Already have access? <Link to="/login" style={{ color: "#183c35", fontWeight: 700 }}>Return to sign in</Link>
          </p>
        </div>
      </section>
      <Modal
        open={Boolean(createdUser)}
        title={
          <span style={{ fontWeight: 700, color: "#183c35" }}>
            Operator Account Created
          </span>
        }
        okText="Continue to Sign In"
        cancelButtonProps={{ style: { display: "none" } }}
        onOk={() => navigate("/login")}
        onCancel={() => navigate("/login")}
      >
        <p>Your account is ready. Use this generated user ID to sign in:</p>
        <div style={{ textAlign: "center", margin: "16px 0" }}>
          <strong className="generated-user-id">{createdUser?.userId}</strong>
        </div>
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>
          Assigned Role: <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{createdUser?.role || "Cashier"}</span>
        </p>
      </Modal>
    </main>
  );
};

export default RegistrationForm
