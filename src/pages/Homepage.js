import React, { useEffect, useState } from 'react';
import DefaultLayout from '../components/Defaultlayouts';
import { Row, Col, Input, Button } from 'antd';
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import ItemsList from '../components/ItemsList';
import { ShoppingCartOutlined } from "@ant-design/icons";
import "../styles/Defaultlayouts.css";

const { Search } = Input;

const Homepage = () => {
    const { cartItems } = useSelector(state => state.rootReducer);
    const navigate = useNavigate();
    const [itemsData, setItemsData] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const dispatch = useDispatch();

    useEffect(() => {
        const getAllItems = async () => {
            try {
                dispatch({ type: 'SHOW_LOADING' });
                const { data } = await axios.get('/api/items/get-item');
                setItemsData(data);
                dispatch({ type: 'HIDE_LOADING' });
            } catch (error) {
                console.log(error);
            }
        };
        getAllItems();
    }, [dispatch]);

    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const filteredItems = itemsData
        .filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (selectedCategory === '' || item.category === selectedCategory)
        );

    const categories = [
        { name: 'All', value: '' },
        { name: 'Shower', value: 'Shower' },
        { name: 'Sink', value: 'Sink' },
        { name: 'Tap', value: 'Tap' },
        { name: 'Nails', value: 'Nails' },
        { name: 'Pipe', value: 'Pipe' },
        { name: 'Water Tank', value: 'Water Tank' },
        { name: 'Elbow', value: 'Elbow' },
        { name: 'Others', value: 'Others' },
    ];

    return (
        <DefaultLayout>
            
            <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Search
                    placeholder="Search items..."  value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    style={{ width: '55%' }}/>
                <div className="cart-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('./cart')}>
                    <p style={{ margin: '0 0px 10px 0' }}>{cartItems.length}</p>
                    <ShoppingCartOutlined />
                </div>
            </div>

            <div className="category-filters" style={{ marginBottom: '16px' }}>
                {categories.map((category) => (
                    <Button
                        key={category.value}
                        type={selectedCategory === category.value ? 'primary' : 'default'}
                        onClick={() => handleCategoryChange(category.value)}
                        style={{ margin: '4px' }}
                    >
                        {category.name}
                    </Button>
                ))}
            </div>

            <Row>
                {filteredItems.map((item) => (
                    <Col key={item._id} xs={24} lg={6} md={12} sm={24}>
                        <ItemsList item={item} />
                    </Col>
                ))}
            </Row>
        </DefaultLayout>
    );
};

export default Homepage;
