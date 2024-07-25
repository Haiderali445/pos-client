import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import DefaultLayout from "../components/Defaultlayouts";
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import { DeleteOutlined, PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { DatePicker } from 'antd';

const Cartpage = () => {
    const [grandTotal, setGrandTotal] = useState(0);
    const [billPopup, setBillPopup] = useState(false);
    const navigate = useNavigate();
    const { cartItems } = useSelector(state => state.rootReducer);
    const dispatch = useDispatch();

    // Handle increment
    const handleIncrement = (record) => {
        dispatch({
            type: 'UPDATE_CART',
            payload: { ...record, quantity: record.quantity + 1 },
        });
    };

    // Handle decrement
    const handleDecrement = (record) => {
        if (record.quantity !== 1) {
            dispatch({
                type: 'UPDATE_CART',
                payload: { ...record, quantity: record.quantity - 1 },
            });
        }
    };

    // Calculate grand total
    useEffect(() => {
        let temp = 0;
        cartItems.forEach(item => temp += (item.salePrice * item.quantity));
        setGrandTotal(temp);
    }, [cartItems]);

    const handleGenerateInvoice = () => {
        setBillPopup(true);
    };

    const handleModalClose = () => {
        setBillPopup(false);
    };

    const handleSubmit = async (values) => {
        try {
            const authData = localStorage.getItem('auth');
            const userId = authData ? JSON.parse(authData)._id : null;

            const paidAmount = parseFloat(values.paidAmount);
            const totalAmount = grandTotal;

            const newBill = {
                ...values,
                date: values.date.toISOString(), 
                cartItems,
                paidAmount,
                totalAmount,
                userId,
            };

            await axios.post('http://localhost:8080/api/bill/add-bill', newBill);
            message.success('Bill generated successfully');
            navigate('/bills');

        } catch (error) {
            message.error('Something went wrong');
            console.error(error);
        }
    };

    const columns = [
        { title: 'Name', dataIndex: 'name' },
        {
            title: 'Image',
            dataIndex: 'image',
            render: (image, record) => (
                <img src={image} alt={record.name} height='60' width='60' />
            ),
        },
        { title: 'Price', dataIndex: 'salePrice' },
        {
            title: 'Quantity',
            dataIndex: '_id',
            render: (id, record) => (
                <div>
                    <MinusCircleOutlined
                        className='mx-4'
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleDecrement(record)}
                    />
                   
                    <b>{record.quantity}</b>
                    <PlusCircleOutlined
                        className='mx-4'
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleIncrement(record)}
                    />
                </div>
            ),
        },
        {
            title: 'Actions',
            dataIndex: '_id',
            render: (id, record) => (
                <DeleteOutlined
                    onClick={() => {
                        dispatch({
                            type: 'DELETE_FROM_CART',
                            payload: record,
                        }) ;
                    }}
                    style={{ color: 'red', cursor: 'pointer' }}
                />
            ),
        },
    ];

    return (
        <DefaultLayout>
            <h1>Welcome to Cart Page</h1>
            <Table columns={columns} dataSource={cartItems} />
            <div className='d-flex flex-column align-items-end'>
                <hr />
                <h3>
                    GRAND TOTAL: <b>{grandTotal}</b> / -
                </h3>
                <Button type='primary' onClick={handleGenerateInvoice}>
                    GENERATE INVOICE
                </Button>
            </div>


            <Modal
                title='Create Invoice'
                visible={billPopup}
                onCancel={handleModalClose}
                footer={null}
            >
                <Form layout='vertical' onFinish={handleSubmit}>
                    <Form.Item
                        label='Customer Name'
                        name='costumerName'
                        rules={[{ required: true, message: 'Please enter customer name' }]}
                    >
                        <Input placeholder='Enter Customer Name' />
                    </Form.Item>
                    <Form.Item
                        label='Customer Phone'
                        name='costumerNumber'
                        rules={[{ required: true, message: 'Please enter customer phone' }]}
                    >
                        <Input placeholder='Enter Customer Phone' />
                    </Form.Item>
                    <Form.Item name='paymentMethod' label='Payment Method' rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value='cash'>Cash</Select.Option>
                            <Select.Option value='card'>Card</Select.Option>
                            <Select.Option value='borrow'>Borrow</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label='Paid Amount'
                        name='paidAmount'
                        rules={[{ required: true, message: 'Please enter paid amount' }]}
                    >
                        <Input type='number' min={0} placeholder='Enter paid amount' />
                    </Form.Item>
                    
                    {/* Add a date field to the form */}
                    <Form.Item
                        label='Date'
                        name='date'
                        rules={[{ required: true, message: 'Please select a date' }]}
                    >
                        <DatePicker placeholder='Select a date' />
                    </Form.Item>

                    <div className='d-flex justify-content-end'>
                        <Button type='primary' htmlType='submit'>
                            GENERATE BILL
                        </Button>
                    </div>
                </Form>
            </Modal>
        </DefaultLayout>
    );
};

export default Cartpage;
