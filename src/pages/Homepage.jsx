import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Row,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Skeleton,
  Tag,
  Tooltip,
} from "antd";
import {
  BarcodeOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  KeyOutlined,
  MinusOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import DefaultLayout from "../components/Defaultlayouts";
import useBarcodeScanner from "../hooks/useBarcodeScanner";
import usePosShortcuts from "../hooks/usePosShortcuts";
import { useCheckoutMutation, useProducts } from "../hooks/usePosQueries";
import {
  handleAddItemToCart,
  handleBarcodeScan,
  extractCatalogCategories,
  filterCatalogProducts,
} from "../handlers/posHandlers";
import {
  calculateCartTotal,
  handleCheckoutSubmission,
} from "../handlers/cartHandlers";
import { notifyInfo } from "../utils/errorHandler";
import "../styles/Pos.css";

function CartContent({ cartItems, dispatch, onOpenCheckout }) {
  const subtotal = useMemo(() => calculateCartTotal(cartItems), [cartItems]);

  return (
    <div className="pos-cart-inner">
      <div className="pos-cart-heading">
        <div>
          <span className="pos-kicker">Active Transaction</span>
          <h2>Current Sale</h2>
        </div>
        <Badge count={cartItems.reduce((acc, item) => acc + item.quantity, 0)} showZero color="#183c35">
          <ShoppingCartOutlined className="pos-cart-icon" />
        </Badge>
      </div>

      <div className="pos-cart-lines">
        {cartItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Cart is empty. Scan barcode or click an item."
            style={{ margin: "40px 0" }}
          />
        ) : (
          cartItems.map((item) => (
            <div className="pos-cart-line" key={item._id}>
              <div className="pos-cart-line-copy">
                <strong>{item.name}</strong>
                <span>PKR {Number(item.salePrice).toFixed(2)} each</span>
              </div>
              <div className="pos-cart-line-actions">
                <Button
                  size="small"
                  shape="circle"
                  icon={<MinusOutlined />}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_CART",
                      payload: { ...item, quantity: Math.max(1, item.quantity - 1) },
                    })
                  }
                />
                <span className="pos-cart-qty-text">{item.quantity}</span>
                <Button
                  size="small"
                  shape="circle"
                  icon={<PlusOutlined />}
                  disabled={item.quantity >= item.stock}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_CART",
                      payload: { ...item, quantity: item.quantity + 1 },
                    })
                  }
                />
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => dispatch({ type: "DELETE_FROM_CART", payload: item })}
                />
              </div>
              <strong className="pos-cart-line-total">
                PKR {(item.salePrice * item.quantity).toFixed(2)}
              </strong>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div style={{ textAlign: "right", padding: "4px 0" }}>
          <Button
            size="small"
            type="link"
            danger
            icon={<ClearOutlined />}
            onClick={() => dispatch({ type: "CLEAR_CART" })}
          >
            Clear Basket
          </Button>
        </div>
      )}

      <div className="pos-cart-summary">
        <div>
          <span>Subtotal</span>
          <strong>PKR {subtotal.toFixed(2)}</strong>
        </div>
        <div>
          <span>Tax / GST</span>
          <strong>PKR 0.00</strong>
        </div>
        <div className="pos-cart-total">
          <span>Net Total</span>
          <strong style={{ color: "#183c35", fontSize: 20 }}>
            PKR {subtotal.toFixed(2)}
          </strong>
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        block
        className="pos-checkout-btn"
        disabled={!cartItems.length}
        onClick={onOpenCheckout}
      >
        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span>Proceed to Pay</span>
          <span className="pos-shortcut">
            <KeyOutlined /> F4
          </span>
        </span>
      </Button>
    </div>
  );
}

const Homepage = () => {
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.rootReducer);
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const checkoutMutation = useCheckoutMutation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [completedBill, setCompletedBill] = useState(null);
  const [invoicePromptVisible, setInvoicePromptVisible] = useState(false);
  const [invoiceVisible, setInvoiceVisible] = useState(false);

  const searchRef = useRef(null);
  const [form] = Form.useForm();

  const total = useMemo(() => calculateCartTotal(cartItems), [cartItems]);
  const paidAmount = Form.useWatch("paidAmount", form) || 0;
  const paymentMethod = Form.useWatch("paymentMethod", form);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 150);
    return () => window.clearTimeout(timer);
  }, [search]);

  const addProduct = (product) => {
    handleAddItemToCart({ product, cartItems, dispatch });
  };

  const scanProduct = (code) => {
    handleBarcodeScan({ code, products, cartItems, dispatch });
  };

  const scanner = useBarcodeScanner(scanProduct);

  const openCheckout = () => {
    if (!cartItems.length) {
      notifyInfo("Please add items to the cart before checkout.");
      return;
    }
    form.setFieldsValue({
      paidAmount: total,
      paymentMethod: "cash",
      costumerName: "",
      costumerNumber: "",
    });
    setCheckoutModalOpen(true);
    setMobileCartOpen(false);
  };

  usePosShortcuts({
    onScanner: () => {
      scanner.focusScanner();
      searchRef.current?.focus();
    },
    onCheckout: () => {
      if (cartItems.length) {
        openCheckout();
      }
    },
    onEscape: () => {
      setSearch("");
      setCheckoutModalOpen(false);
      setMobileCartOpen(false);
    },
    onSearch: () => {
      searchRef.current?.focus();
    },
  });

  const categories = useMemo(() => extractCatalogCategories(products), [products]);

  const filteredProducts = useMemo(
    () => filterCatalogProducts(products, debouncedSearch, category),
    [category, debouncedSearch, products]
  );

  const handleCheckoutSubmit = async (values) => {
    await handleCheckoutSubmission({
      checkoutMutation,
      values,
      cartItems,
      total,
      onSuccess: (result) => {
        dispatch({ type: "CLEAR_CART" });
        setCheckoutModalOpen(false);
        setCompletedBill(result?.data || result);
        setInvoicePromptVisible(true);
      },
    });
  };

  return (
    <DefaultLayout>
      <div className="pos-page">
        {/* Main Catalog View */}
        <section className="pos-catalog">
          {/* Header Bar */}
          <div className="pos-toolbar">
            <div className="pos-heading">
              <span className="pos-kicker">Store POS Grid</span>
              <h1>Product Catalog</h1>
            </div>
            <div className="pos-toolbar-hint">
              <BarcodeOutlined style={{ color: "#2d8a55", fontSize: 16 }} />
              <span>Scanner Ready</span>
              <span className="pos-hotkey">F2</span>
            </div>
          </div>

          {/* Hidden Barcode scanner listener input */}
          <Input
            ref={scanner.inputRef}
            value={scanner.value}
            onChange={scanner.handleChange}
            onKeyDown={scanner.handleKeyDown}
            className="pos-scanner-input"
            aria-label="Hardware barcode scanner receptor"
          />

          {/* Search bar */}
          <div style={{ marginBottom: 16 }}>
            <Input
              ref={searchRef}
              size="large"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              placeholder="Search items by name, SKU, or barcode (Ctrl+K)..."
              allowClear
              className="pos-search-input"
            />
          </div>

          {/* Categories Pill Bar */}
          <div className="pos-category-row">
            {categories.map((cat) => (
              <Button
                key={cat}
                type={category === cat ? "primary" : "default"}
                onClick={() => setCategory(cat)}
                className={`pos-category-btn ${category === cat ? "is-active" : ""}`}
              >
                {cat === "all" ? "All Products" : cat}
              </Button>
            ))}
          </div>

          {/* Error Banner */}
          {isError && (
            <Alert
              type="error"
              showIcon
              message="Failed to load product catalog"
              action={
                <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
                  Retry
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Product Grid */}
          {isLoading ? (
            <div className="pos-product-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} style={{ borderRadius: 12 }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Empty
              className="pos-empty"
              description="No matching products found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="pos-product-grid">
              {filteredProducts.map((product) => {
                const outOfStock = product.stock < 1;
                const lowStock = !outOfStock && product.stock <= (product.reorderLevel || 5);
                const inCart = cartItems.find((i) => i._id === product._id);

                return (
                  <Card
                    key={product._id}
                    className={`pos-product-card ${outOfStock ? "is-out-of-stock" : ""} ${inCart ? "is-in-cart" : ""}`}
                    hoverable={!outOfStock}
                    onClick={() => addProduct(product)}
                  >
                    <div className="pos-product-topline">
                      <Tag color={outOfStock ? "default" : lowStock ? "warning" : "success"}>
                        {outOfStock ? "Out of Stock" : `${product.stock} in stock`}
                      </Tag>
                      <span className="pos-product-cat">{product.category || "General"}</span>
                    </div>

                    {product.image ? (
                      <div className="pos-product-img-wrap">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="pos-product-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="pos-product-symbol">
                        {product.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <h3 className="pos-product-title" title={product.name}>
                      {product.name}
                    </h3>

                    <div className="pos-product-bottom">
                      <div>
                        <span className="pos-product-price-label">Price</span>
                        <div className="pos-product-price">
                          PKR {Number(product.salePrice).toFixed(2)}
                        </div>
                      </div>

                      <Tooltip title={outOfStock ? "Out of Stock" : "Add to Cart"}>
                        <Button
                          type={inCart ? "primary" : "default"}
                          disabled={outOfStock}
                          icon={<PlusOutlined />}
                          shape="circle"
                          style={
                            inCart
                              ? { backgroundColor: "#183c35", borderColor: "#183c35" }
                              : {}
                          }
                        />
                      </Tooltip>
                    </div>

                    {inCart && (
                      <div className="pos-in-cart-indicator">
                        <CheckCircleOutlined /> In Cart ({inCart.quantity})
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Desktop Sticky Side Cart */}
        <aside className="pos-cart-dock">
          <CartContent
            cartItems={cartItems}
            dispatch={dispatch}
            onOpenCheckout={openCheckout}
          />
        </aside>

        {/* Mobile Floating Cart Trigger Bar */}
        <div className="pos-mobile-cart-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge count={cartItems.reduce((sum, item) => sum + item.quantity, 0)} color="#f2c14e">
              <ShoppingCartOutlined style={{ fontSize: 22, color: "#fff" }} />
            </Badge>
            <div>
              <div style={{ color: "#dbe4dd", fontSize: 11 }}>Total ({cartItems.length} items)</div>
              <strong style={{ color: "#fff", fontSize: 16 }}>PKR {total.toFixed(2)}</strong>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            disabled={!cartItems.length}
            onClick={() => setMobileCartOpen(true)}
            style={{ backgroundColor: "#f2c14e", color: "#183c35", fontWeight: 700, border: "none" }}
          >
            Review Cart
          </Button>
        </div>

        {/* Mobile / Tablet Cart Drawer */}
        <Drawer
          title="Active Basket"
          placement="right"
          width={360}
          onClose={() => setMobileCartOpen(false)}
          open={mobileCartOpen}
          bodyStyle={{ padding: 16 }}
        >
          <CartContent
            cartItems={cartItems}
            dispatch={dispatch}
            onOpenCheckout={openCheckout}
          />
        </Drawer>

        {/* Checkout Modal */}
        <Modal
          open={checkoutModalOpen}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ThunderboltOutlined style={{ color: "#f2c14e" }} />
              <span>Complete Payment & Issue Invoice</span>
            </div>
          }
          onCancel={() => setCheckoutModalOpen(false)}
          okText="Confirm & Complete Sale"
          confirmLoading={checkoutMutation.isPending}
          onOk={() => form.submit()}
          destroyOnClose
          width={520}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCheckoutSubmit}
            initialValues={{ paymentMethod: "cash", paidAmount: total }}
          >
            <div className="checkout-total-card">
              <span>Total Payable Amount</span>
              <strong>PKR {total.toFixed(2)}</strong>
            </div>

            <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
              <Radio.Group optionType="button" buttonStyle="solid" style={{ width: "100%", display: "flex" }}>
                <Radio.Button value="cash" style={{ flex: 1, textAlign: "center" }}>
                  <DollarOutlined /> Cash
                </Radio.Button>
                <Radio.Button value="card" style={{ flex: 1, textAlign: "center" }}>
                  <CreditCardOutlined /> Card
                </Radio.Button>
                <Radio.Button value="borrow" style={{ flex: 1, textAlign: "center" }}>
                  Credit / Borrow
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="costumerName" label="Customer Name (Optional)">
                  <Input placeholder="e.g. John" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="costumerNumber" label="Customer Phone (Optional)">
                  <Input placeholder="e.g. 03001234567" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="paidAmount"
              label="Amount Received (Tendered)"
              rules={[
                { required: true, message: "Enter the amount paid by customer" },
                {
                  validator: (_, value) =>
                    paymentMethod === "borrow" || Number(value) >= total
                      ? Promise.resolve()
                      : Promise.reject(new Error("Amount received must cover total amount")),
                },
              ]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: "100%" }}
                size="large"
                placeholder="Enter paid amount"
              />
            </Form.Item>

            <div className="checkout-change-row">
              <span>Customer Change:</span>
              <Tag
                color={Number(paidAmount) >= total ? "success" : "warning"}
                style={{ fontSize: 14, padding: "4px 10px" }}
              >
                PKR {Math.max(0, Number(paidAmount) - total).toFixed(2)}
              </Tag>
            </div>
          </Form>
        </Modal>

        <Modal
          open={invoicePromptVisible}
          title="Sale Completed"
          onCancel={() => setInvoicePromptVisible(false)}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setInvoicePromptVisible(false);
                setCompletedBill(null);
              }}
            >
              Do Not Print
            </Button>,
            <Button
              key="show"
              onClick={() => {
                setInvoicePromptVisible(false);
                setInvoiceVisible(true);
              }}
            >
              Show Invoice
            </Button>,
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => {
                setInvoicePromptVisible(false);
                setInvoiceVisible(true);
                window.setTimeout(() => window.print(), 0);
              }}
            >
              Print Invoice
            </Button>,
          ]}
        >
          <p>Would you like to view or print the invoice for this sale?</p>
        </Modal>

        <Modal
          open={invoiceVisible}
          title="Invoice Preview"
          onCancel={() => setInvoiceVisible(false)}
          footer={[
            <Button key="close" onClick={() => setInvoiceVisible(false)}>
              Close
            </Button>,
            <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print Invoice
            </Button>,
          ]}
        >
          {completedBill && (
            <div className="checkout-invoice-preview">
              <div className="checkout-invoice-brand">HARDWARE POINT</div>
              <div className="checkout-invoice-subtitle">Main Retail Terminal, Branch 01</div>
              <div className="checkout-invoice-rule" />
              <div className="checkout-invoice-meta">
                <span>Date: {new Date(completedBill.date || Date.now()).toLocaleString()}</span>
                <span>Payment: {completedBill.paymentMethod || "cash"}</span>
                {completedBill.costumerName && <span>Customer: {completedBill.costumerName}</span>}
                {completedBill.costumerNumber && <span>Phone: {completedBill.costumerNumber}</span>}
              </div>
              <div className="checkout-invoice-items">
                {(completedBill.cartItems || []).map((item) => (
                  <div className="checkout-invoice-item" key={item._id}>
                    <span>{item.name} x {item.quantity}</span>
                    <strong>PKR {(Number(item.salePrice) * Number(item.quantity)).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
              <div className="checkout-invoice-total">
                <span>Total</span>
                <strong>PKR {Number(completedBill.totalAmount || 0).toFixed(2)}</strong>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default Homepage;