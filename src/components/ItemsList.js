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

    return (
        <div>
            <Card
                style={{
                    width: 240,
                    height: 'auto',
                }}
                cover={
                    <img
                        alt={item.name}
                        src={item.image}
                        style={{ height: 250, marginBottom: 30, marginTop: 10 }}
                    />
                }
            >
                <Meta title={item.name} description={`Price: PKR:${item.salePrice}`} />
                

                <p>
                    Status: {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </p>

                <div className="item-btn">
                    <Button
                        type="primary"
                        onClick={handleAddToCart}
                        disabled={item.stock === 0} 
                    >
                        Add to Cart
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ItemsList;
