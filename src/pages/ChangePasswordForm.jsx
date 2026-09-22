import React, { useState } from "react";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { KeyOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import DefaultLayout from "../components/Defaultlayouts";
import apiClient from "../api/client";

const { Title, Text } = Typography;

const ChangePasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  const currentUser = auth?.user || {};

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await apiClient.post("/users/reset-password", {
        userId: values.userId || currentUser.userId,
        name: values.name || currentUser.name,
        newPassword: values.newPassword,
      });

      message.success("Password updated successfully!");
      form.resetFields();
    } catch (error) {
      message.error(
        error.response?.data?.error || "Failed to change password. Verify your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 40 }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b9991", fontWeight: 700 }}>
            Account Security
          </span>
          <Title level={2} style={{ margin: "2px 0 0", color: "#183c35" }}>
            Change Account Password
          </Title>
          <Text type="secondary">
            Update your POS operator login password.
          </Text>
        </div>

        <Card bordered={false} style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.05)", borderRadius: 12 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              userId: currentUser.userId || "",
              name: currentUser.name || "",
            }}
          >
            <Form.Item
              name="userId"
              label="User ID"
              rules={[{ required: true, message: "User ID is required" }]}
            >
              <Input prefix={<UserOutlined />} disabled={Boolean(currentUser.userId)} />
            </Form.Item>

            <Form.Item
              name="name"
              label="Operator Full Name"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="e.g. John Doe" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Please enter your new password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Please confirm your new password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("The two passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<KeyOutlined />}
              style={{
                backgroundColor: "#183c35",
                borderColor: "#183c35",
                height: 44,
                fontWeight: 700,
                marginTop: 10,
              }}
              block
            >
              Update Password
            </Button>
          </Form>
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default ChangePasswordForm;
