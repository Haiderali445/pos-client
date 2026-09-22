import React from 'react';
import { Button, Card, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

const ItemsList = ({ item }) => {
    const { Meta } = Card;
    const dispatch = useDispatch();

    const cartItems = useSelector(state => state.rootReducer.cartItems);

    const isItemInCart = cartItems.some(cartItem => cartItem._id === item._id);

    const handleAddToCart = () => {
        if (isItemInCart) {
            message.info('Item is already in the cart.');
        } else {
            dispatch({
                type: 'ADD_TO_CART',
                payload: { ...item, quantity: 1 },
            });
            message.success('Item added to the cart.');
        }
    };

    const outOfStock = Number(item.stock || 0) < 1;
    const cost = Number(item.purchasePrice || 0);
    const price = Number(item.salePrice || item.price || 0);
    const profit = Math.max(0, price - cost);
    const marginPct = price > 0 ? ((profit / price) * 100).toFixed(0) : 0;
    const activeBatchesCount =
      (item.stockBatches || []).filter((b) => Number(b.availableQty) > 0).length ||
      (Number(item.stock) > 0 ? 1 : 0);

    return (
        <Card
            hoverable={!outOfStock}
            style={{
                width: 240,
                borderRadius: 12,
                border: "1px solid #dfe8e1",
                boxShadow: "0 2px 10px rgba(24,60,53,0.04)",
                overflow: "hidden",
                opacity: outOfStock ? 0.65 : 1,
            }}
            cover={
                item.image ? (
                    <div style={{ height: 160, overflow: "hidden", backgroundColor: "#f4f7f4", display: "grid", placeItems: "center" }}>
                        <img
                            alt={item.name}
                            src={item.image}
                            style={{ height: "100%", width: "100%", objectFit: "contain" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                    </div>
                ) : (
                    <div style={{ height: 120, display: "grid", placeItems: "center", backgroundColor: "#eaf2ec", color: "#183c35", fontWeight: 800, fontSize: 24 }}>
                        {item.name ? item.name.slice(0, 1).toUpperCase() : "P"}
                    </div>
                )
            }
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span
                    style={{
                        display: "inline-block",
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: 11,
                        padding: "2px 8px",
                        border: outOfStock ? "1px solid #fca5a5" : "1px solid #7be4a3",
                        backgroundColor: outOfStock ? "#fee2e2" : "#e6f9ed",
                        color: outOfStock ? "#991b1b" : "#0d6832",
                    }}
                >
                    {outOfStock ? "Out of Stock" : `${item.stock} in stock`}
                </span>
                <span style={{ fontSize: 11, color: "#183c35", fontWeight: 700, background: "#eaf1ed", padding: "2px 6px", borderRadius: 4 }}>
                    {item.category || "General"}
                </span>
            </div>

            <div style={{ fontWeight: 700, fontSize: 14, color: "#183c35", marginBottom: 6, minHeight: 40, lineHeight: 1.3 }}>
                {item.name}
            </div>

            {/* FIFO Batch & Margin Transparency */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: "#f9f0ff",
                        color: "#722ed1",
                        border: "1px solid #d3adf7",
                        borderRadius: 4,
                        padding: "1px 6px",
                    }}
                >
                    {activeBatchesCount} {activeBatchesCount === 1 ? "FIFO Batch" : "FIFO Batches"}
                </span>
                {cost > 0 && profit > 0 && (
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            backgroundColor: "#f6ffed",
                            color: "#389e0d",
                            border: "1px solid #b7eb8f",
                            borderRadius: 4,
                            padding: "1px 6px",
                        }}
                    >
                        +{marginPct}% Margin
                    </span>
                )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div>
                    <span style={{ fontSize: 10, color: "#526e60", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Price</span>
                    <strong style={{ fontSize: 16, color: "#183c35", fontFamily: "'Space Grotesk', sans-serif" }}>
                        PKR {Number(item.salePrice || item.price || 0).toFixed(2)}
                    </strong>
                </div>
                <Button
                    type="primary"
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                    style={{
                        backgroundColor: isItemInCart ? "#2d8a55" : "#183c35",
                        borderColor: isItemInCart ? "#2d8a55" : "#183c35",
                        fontWeight: 700,
                        borderRadius: 8,
                    }}
                >
                    {isItemInCart ? "Added" : "Add to Cart"}
                </Button>
            </div>
        </Card>
    );
};

export default ItemsList;
