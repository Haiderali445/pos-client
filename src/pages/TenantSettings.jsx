import React from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Segmented,
  Select,
  Spin,
  Typography,
  message,
} from "antd";
import {
  GlobalOutlined,
  PhoneOutlined,
  SaveOutlined,
  SettingOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import DefaultLayout from "../components/Defaultlayouts";
import { useTenantSettings } from "../hooks/useTenantSettings";
import { Thermal80mmTemplate, StandardA4Template } from "../templates";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function TenantSettings() {
  const { tenantSettings, isLoading, updateSettings } = useTenantSettings();
  const [form] = Form.useForm();
  const [previewTemplate, setPreviewTemplate] = React.useState("thermal80mm");

  React.useEffect(() => {
    if (tenantSettings) {
      form.setFieldsValue(tenantSettings);
      setPreviewTemplate(tenantSettings.receiptTemplate || "thermal80mm");
    }
  }, [tenantSettings, form]);

  const handleSave = async (values) => {
    try {
      await updateSettings.mutateAsync(values);
      message.success("Store settings saved successfully!");
    } catch (err) {
      message.error(err.response?.data?.error || "Failed to save settings.");
    }
  };

  const taxStrategy = Form.useWatch("taxStrategy", form);

  const previewBill = {
    _id: "PREVIEW00001",
    date: new Date(),
    costumerName: "Sample Customer",
    paymentMethod: "cash",
    subtotal: 1000,
    taxAmount: 170,
    totalAmount: 1170,
    paidAmount: 1200,
    cartItems: [
      { _id: "1", name: "Sample Item A", quantity: 2, salePrice: 400 },
      { _id: "2", name: "Sample Item B", quantity: 1, salePrice: 200 },
    ],
  };

  return (
    <DefaultLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b9991", fontWeight: 700 }}>
            System Configuration
          </span>
          <Title level={2} style={{ margin: "2px 0 0", color: "#183c35" }}>
            Tenant & Store Settings
          </Title>
        </div>

        <Spin spinning={isLoading}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={13}>
              <Card
                title={<span><SettingOutlined style={{ marginRight: 8 }} />Store Configuration</span>}
                bordered={false}
                style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.06)", borderRadius: 12 }}
              >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                  <Form.Item name="name" label="Store / Business Name" rules={[{required: true}]}>
                    <Input prefix={<ShopOutlined />} placeholder="e.g. Hardware Point" size="large" />
                  </Form.Item>

                  <Form.Item name="address" label="Address">
                    <TextArea rows={2} placeholder="Store address for receipts" />
                  </Form.Item>

                  <Form.Item name="contactPhone" label="Contact Phone">
                    <Input prefix={<PhoneOutlined />} placeholder="+92 (300) 000-0000" />
                  </Form.Item>

                  <Form.Item name="currency" label="Currency">
                    <Select>
                      <Option value="PKR">PKR — Pakistani Rupee</Option>
                      <Option value="USD">USD — US Dollar</Option>
                      <Option value="EUR">EUR — Euro</Option>
                      <Option value="GBP">GBP — British Pound</Option>
                      <Option value="AED">AED — UAE Dirham</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="taxStrategy" label="Tax Strategy">
                    <Radio.Group>
                      <Radio value="zero">No Tax (Zero Rated)</Radio>
                      <Radio value="flat">Flat Rate Tax</Radio>
                      <Radio value="vat">VAT Per Item</Radio>
                    </Radio.Group>
                  </Form.Item>

                  {taxStrategy && taxStrategy !== "zero" && (
                    <Form.Item name="taxRate" label="Tax Rate (%i" rules={[{required: true, message: "Enter tax rate"}]}>
                      <InputNumber min={0} max={100} precision={2} style={{ width: "100%" }} placeholder="e.g. 17 for 17% GST" />
                    </Form.Item>
                  )}

                  <Form.Item name="receiptTemplate" label="Default Receipt Template">
                    <Segmented
                      options={[
                        { label: "Thermal 80mm", value: "thermal80mm" },
                        { label: "Standard A4", value: "standardA4" },
                      ]}
                      onChange={v => setPreviewTemplate(v)}
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={updateSettings.isPending}
                    size="large"
                    style={{ backgroundColor: "#183c35", borderColor: "#183c35" }}
                  >
                    Save Settings
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={11}>
              <Card
                title={<span><GlobalOutlined style={{ marginRight: 8 }} />Receipt Preview</span>}
                bordered={false}
                style={{ boxShadow: "0 4px 16px rgba(24,60,53,0.06)", borderRadius: 12 }}
              >
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                  Live preview using current settings
                </Text>
                <div style={{ backgroundColor: "#f4f6f3", padding: 12, borderRadius: 8, overflowX: "auto" }}>
                  <div style={{
                    transform: previewTemplate === "standardA4" ? "scale(0.45)" : "scale(0.9)",
                    transformOrigin: "top left",
                    marginBottom: previewTemplate === "standardA4" ? -320 : 0,
                  }}>
                    {previewTemplate === "standardA4" ? (
                      <StandardA4Template bill={previewBill} tenant={tenantSettings} />
                    ) : (
                      <Thermal80mmTemplate bill={previewBill} tenant={tenantSettings} />
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </DefaultLayout>
  );
}

