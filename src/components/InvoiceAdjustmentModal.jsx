import React, { useEffect } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  message,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useAccountAdjustmentMutation, useAdjustmentMutation, useProducts } from "../hooks/usePosQueries";

export default function InvoiceAdjustmentModal({
  open,
  onClose,
  invoice = null,
  account = null,
  onComplete,
}) {
  const [form] = Form.useForm();
  const { data: products = [] } = useProducts();
  const itemAdjustment = useAdjustmentMutation();
  const balanceAdjustment = useAccountAdjustmentMutation();
  const busy = itemAdjustment.isPending || balanceAdjustment.isPending;
  const linkedAccount = account || (
    invoice?.accountId && typeof invoice.accountId === "object" ? invoice.accountId : null
  );
  const accountId = linkedAccount?._id || (
    typeof invoice?.accountId === "string" ? invoice.accountId : null
  );
  const isCustomer = linkedAccount?.accountType === "Customer" || invoice?.invoiceType === "Sale";

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      adjustmentType: invoice ? "items" : "balance",
      direction: "reduce",
      items: [{ action: "return", quantity: 1, condition: "resellable" }],
    });
  }, [form, invoice, open]);

  const handleSubmit = async (values) => {
    try {
      if (values.adjustmentType === "balance") {
        if (!accountId) {
          message.error("This invoice/account is not linked to a customer or supplier account.");
          return;
        }
        await balanceAdjustment.mutateAsync({
          accountId,
          amount: values.amount,
          direction: values.direction,
          reason: values.reason,
          relatedInvoiceId: invoice?._id,
        });
        message.success(
          values.direction === "reduce"
            ? "Agreed balance reduction recorded. Stock and invoice sales history were not changed."
            : "Additional balance charge recorded. Stock and invoice sales history were not changed."
        );
      } else {
        await itemAdjustment.mutateAsync({
          billId: invoice._id,
          accountId,
          reason: values.reason,
          items: values.items,
        });
        message.success("Return/replacement recorded. Stock and account balance were updated.");
      }
      onComplete?.();
      onClose();
    } catch (error) {
      message.error(error.response?.data?.error || error.message || "Could not save the adjustment.");
    }
  };

  return (
    <Modal
      title={invoice ? `Adjust invoice ${invoice.invoiceNumber || ""}` : `Adjust ${account?.name || "account"} balance`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save adjustment"
      confirmLoading={busy}
      width={760}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {invoice && (
          <Form.Item name="adjustmentType" label="Adjustment type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "items", label: "Return or replace items (changes stock)" },
                { value: "balance", label: "Agreed money adjustment (no stock change)" },
              ]}
            />
          </Form.Item>
        )}
        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, whitespace: true, message: "Enter a reason for this adjustment" }]}
        >
          <Input.TextArea rows={2} maxLength={250} placeholder="For example: agreed settlement or damaged return" />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(previous, current) =>
          previous.adjustmentType !== current.adjustmentType
        }>
          {({ getFieldValue }) => {
            const isMoneyAdjustment = getFieldValue("adjustmentType") === "balance";
            if (isMoneyAdjustment) {
              return (
                <>
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="This records an agreed account settlement only. It does not rewrite the invoice, sales totals, or stock."
                  />
                  <Row gutter={12}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="direction"
                        label="Balance change"
                        rules={[{ required: true }]}
                      >
                        <Select
                          options={[
                            {
                              value: "reduce",
                              label: isCustomer ? "Reduce what customer owes" : "Reduce what we owe supplier",
                            },
                            {
                              value: "increase",
                              label: isCustomer ? "Add to what customer owes" : "Add to what we owe supplier",
                            },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="amount"
                        label="Agreed amount (PKR)"
                        rules={[{ required: true, message: "Enter the agreed amount" }]}
                      >
                        <InputNumber min={0.01} precision={2} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              );
            }
            return (
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        style={{ marginBottom: 12 }}
                        title={`Item ${field.name + 1}`}
                        extra={fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        )}
                      >
                        <Row gutter={12}>
                          <Col xs={24} sm={8}>
                            <Form.Item name={[field.name, "action"]} label="Action" rules={[{ required: true }]}>
                              <Select options={[
                                { value: "return", label: "Return invoiced item" },
                                { value: "replacement", label: "Give / receive replacement" },
                              ]} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Form.Item noStyle shouldUpdate={(previous, current) =>
                              previous.items?.[field.name]?.action !== current.items?.[field.name]?.action
                            }>
                              {({ getFieldValue: getValue }) =>
                                getValue(["items", field.name, "action"]) === "return" ? (
                                  <Form.Item
                                    name={[field.name, "sourceItemIndex"]}
                                    label="Item from invoice"
                                    rules={[{ required: true, message: "Select an invoiced item" }]}
                                  >
                                    <Select options={(invoice?.cartItems || []).map((item, index) => ({
                                      value: index,
                                      label: `${item.name} — invoiced ${item.quantity}`,
                                    }))} />
                                  </Form.Item>
                                ) : (
                                  <Form.Item
                                    name={[field.name, "productId"]}
                                    label={invoice?.invoiceType === "Sale" ? "Replacement given" : "Replacement received"}
                                    rules={[{ required: true, message: "Select a product" }]}
                                  >
                                    <Select
                                      showSearch
                                      optionFilterProp="label"
                                      options={products.map((product) => ({
                                        value: product._id,
                                        label: product.name,
                                      }))}
                                    />
                                  </Form.Item>
                                )
                              }
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={4}>
                            <Form.Item
                              name={[field.name, "quantity"]}
                              label="Quantity"
                              rules={[{ required: true, message: "Enter quantity" }]}
                            >
                              <InputNumber min={0.001} precision={3} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={4}>
                            <Form.Item noStyle shouldUpdate={(previous, current) =>
                              previous.items?.[field.name]?.action !== current.items?.[field.name]?.action
                            }>
                              {({ getFieldValue: getValue }) =>
                                getValue(["items", field.name, "action"]) === "return" &&
                                invoice?.invoiceType === "Sale" ? (
                                  <Form.Item name={[field.name, "condition"]} label="Condition">
                                    <Select options={[
                                      { value: "resellable", label: "Good" },
                                      { value: "damaged", label: "Damaged" },
                                    ]} />
                                  </Form.Item>
                                ) : null
                              }
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      onClick={() => add({ action: "return", quantity: 1, condition: "resellable" })}
                    >
                      Add another item
                    </Button>
                  </>
                )}
              </Form.List>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
}
