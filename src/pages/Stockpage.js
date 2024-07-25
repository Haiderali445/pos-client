import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { Table, Card, Row, Col, Statistic, Typography } from 'antd';
import DefaultLayout from '../components/Defaultlayouts';

const { Column } = Table;
const { Title } = Typography;

const StockPage = () => {
    // State variables
    const [itemsData, setItemsData] = useState([]);
    const [billsData, setBillsData] = useState([]);
    const [chargesData, setChargesData] = useState([]);
    const [totalCharges, setTotalCharges] = useState(0);
    const [totalSalePrice, setTotalSalePrice] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [updatedStockData, setUpdatedStockData] = useState([]);
    
    
    const [initialTotalPurchasePrice, setInitialTotalPurchasePrice] = useState(0);

    // Pie chart data
    const pieChartData = [
        { name: 'Total Charges', value: totalCharges },
        { name: 'Total Profit', value: totalProfit },
        { name: 'Total Sale Price', value: totalSalePrice },
        { name: 'Total Purchase Price', value: initialTotalPurchasePrice }
    ];

    // Pie Chart Kay clour add karna ho
    const COLORS = ['#FF0000', '#0000FF', '#00C49F', '#32CD32'];

    
    const fetchData = async () => {
        try {
            const [itemsResponse, billsResponse, chargesResponse] = await Promise.all([
                axios.get('/api/items/get-item'),
                axios.get('/api/bill/get-bill'),
                axios.get('/api/charges/get-charges')
            ]);

            setItemsData(itemsResponse.data);
            setBillsData(billsResponse.data);
            setChargesData(chargesResponse.data);

            calculateTotalCharges(chargesResponse.data);
            calculateInitialTotalPurchasePrice(itemsResponse.data);
            calculateTotalSalePriceAndProfit(billsResponse.data);
            calculateUpdatedStock(itemsResponse.data, billsResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Calculate total charges
    const calculateTotalCharges = (chargesData) => {
        const totalCharges = chargesData.reduce((acc, charge) => acc + charge.amount, 0);
        setTotalCharges(totalCharges);
    };

    // Calculate initial total purchase price
    const calculateInitialTotalPurchasePrice = (itemsData) => {
        let totalPurchasePrice = 0;

        // Calculate the total purchase price of all items
        itemsData.forEach(item => {
            totalPurchasePrice += item.purchasePrice * item.stock;
        });

        // Set the initial total purchase price and keep it constant
        setInitialTotalPurchasePrice(totalPurchasePrice);
    };

    // Calculate total sale price and total profit based on bills data
    const calculateTotalSalePriceAndProfit = (billsData) => {
        let totalSalePrice = 0;
        let totalProfit = 0;

        // Iterate through each bill
        billsData.forEach(bill => {
            // Iterate through each item in the bill
            bill.cartItems.forEach(item => {
                // Calculate total sale price for each item
                const itemTotalSalePrice = item.salePrice * item.quantity;

                // Calculate total purchase price for each item
                const itemTotalPurchasePrice = item.purchasePrice * item.quantity;

                // Calculate profit for each item
                const itemProfit = itemTotalSalePrice - itemTotalPurchasePrice;

                // Add item profit to total profit
                totalProfit += itemProfit;

                // Add item total sale price to total sale price
                totalSalePrice += itemTotalSalePrice;
            });
        });

        
        setTotalSalePrice(totalSalePrice);
        setTotalProfit(totalProfit);
    };

    // Calculate updated stock based on bills data
    const calculateUpdatedStock = (itemsData, billsData) => {
        // Map to track total quantity sold per item
        const totalSoldPerItem = {};

        // Calculate total quantity sold per item
        billsData.forEach(bill => {
            bill.cartItems.forEach(cartItem => {
                const { _id, quantity } = cartItem;
                totalSoldPerItem[_id] = (totalSoldPerItem[_id] || 0) + quantity;
            });
        });

        // Calculate updated stock for each item
        const updatedStockData = itemsData.map(item => {
            // Calculate quantity sold for this item
            const totalSold = totalSoldPerItem[item._id] || 0;

            // Calculate updated stock
            const updatedStock = item.stock - totalSold;

            // Return updated item data with updated stock
            return {
                ...item,
                updatedStock
            };
        });

        // Update state with the updated stock data
        setUpdatedStockData(updatedStockData);
    };

    // Calculate remaining stock item price based on updated stock data
    const calculateRemainingStockValue = () => {
        return updatedStockData.reduce((total, item) => {
            return total + item.purchasePrice * item.updatedStock;
        }, 0);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <DefaultLayout>
            <Card>
                <Row justify="center">
                    <Col span={24}>
                        <Title level={2}><h1>STOCK LIST</h1></Title>
                    </Col>
                    <Col span={12} style={{ paddingRight: 20 }}>
                        <Statistic title="Total Purchase Price of All Items" value={`PKR:${initialTotalPurchasePrice.toFixed(2)}`} />
                        <Statistic title="Total Sales of All Items" value={`PKR:${totalSalePrice.toFixed(2)}`} />
                        <Statistic title="Total Charges" value={`PKR:${totalCharges.toFixed(2)}`} />
                        <Statistic title="Total Profit" value={`PKR:${totalProfit.toFixed(2)}`} />
                        <Statistic title="Rest Stock Item Price" value={`PKR:${calculateRemainingStockValue().toFixed(2)}`} /> {/* Rest Stock Item Price */}
                    </Col>

                    <Col span={12}>
                        <PieChart width={200} height={250}>
                            <Pie data={pieChartData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={80}
                                fill="#8884d8">
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </Col>
                </Row>

                <Col span={24}>
                    <Table dataSource={updatedStockData} rowKey="_id">
                        <Column title="Item Name" dataIndex="name" key="name" />
                        <Column title="Category" dataIndex="category" key="category" />
                        <Column title="Purchase Price" dataIndex="purchasePrice" key="purchasePrice" render={value => `PKR:${value.toFixed(2)}`} />
                        <Column title="Sale Price" dataIndex="salePrice" key="salePrice" render={value => `PKR:${value.toFixed(2)}`} />
                        <Column title="Current Stock" dataIndex="updatedStock" key="updatedStock" />
                        <Column title="Total Purchase Price" key="totalPurchasePrice" render={(item) => {
                            const totalPurchasePrice = item.purchasePrice * item.updatedStock;
                            return `PKR:${totalPurchasePrice.toFixed(2)}`;
                        }} />
                    </Table>
                </Col>
            </Card>
        </DefaultLayout>
    );
};

export default StockPage;
