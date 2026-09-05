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
    } catch (error) {
      setError(error.response?.status === 409 ? "That user ID is already in use." : "Unable to create the account.");
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
          {error && <Alert className="auth-alert" type="error" showIcon message={error} />}
          <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item name="name" label="Full name" rules={[{ required: true, message: "Enter a name" }]}><Input size="large" prefix={<UserOutlined />} /></Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, message: "Use at least 8 characters" }]}><Input.Password size="large" prefix={<LockOutlined />} /></Form.Item>
            <Button block size="large" type="primary" htmlType="submit" loading={loading}>Create account</Button>
          </Form>
          <p className="auth-footer">Already have access? <Link to="/login">Return to sign in</Link></p>
        </div>
      </section>
      <Modal
        open={Boolean(createdUser)}
        title="Account created"
        okText="Continue to sign in"
        cancelButtonProps={{ style: { display: "none" } }}
        onOk={() => navigate("/login")}
        onCancel={() => navigate("/login")}
      >
        <p>Your account is ready. Use this generated user ID to sign in:</p>
        <strong className="generated-user-id">{createdUser?.userId}</strong>
        <p className="muted">Role: {createdUser?.role}</p>
      </Modal>
    </main>
  )
}

export default RegistrationForm
