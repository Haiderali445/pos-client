import React, { useEffect, useState } from 'react';
import DefaultLayout from "../components/Defaultlayouts";

import axios from 'axios';
import { Button, Form, Input, message, Modal, Popconfirm, Table } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const ChargesPage = () => {
    const [chargesData, setChargesData] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCharge, setEditingCharge] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const fetchAllCharges = async () => {
        try {
            const response = await axios.get('/api/charges/get-charges');
            setChargesData(response.data);
            calculateTotalAmount(response.data);
        } catch (error) {
            console.error(error);
            message.error('Failed to fetch charges');
        } };

    useEffect(() => {
        fetchAllCharges();
    }, []);

    //  total amount of charges karna ho 
    const calculateTotalAmount = (charges) => {
        const total = charges.reduce((acc, charge) => acc + charge.amount, 0);
        setTotalAmount(total);
    };

    // Handle form submission for adding or editing a charge
    const handleFormSubmit = async (values) => {
        if (editingCharge) {
            await handleUpdate(values);
        } else {
            try {
                await axios.post('/api/charges/add-charge', values);
                message.success('Charge added successfully');
                fetchAllCharges();
                setIsModalVisible(false);
                setEditingCharge(null);
            } catch (error) {
                console.error(error);
                message.error('Failed to add charge');
            }
        }
    };

    // Edit ya updating karna ho .......
    const handleUpdate = async (values) => {
        try {
            await axios.put('/api/charges/edit-charge', {
                ...values,
                chargeId: editingCharge._id,
            });

            message.success('Charge updated successfully');
            fetchAllCharges();
            setIsModalVisible(false);
            setEditingCharge(null);
        } catch (error) {
            console.error(error);
            message.error('Failed to update charge');
        }
    };

    const handleDelete = async (charge) => {
        try {
            await axios.post('/api/charges/delete-charge', { chargeId: charge._id });
            message.success('Charge deleted successfully');
            fetchAllCharges();
        } catch (error) {
            console.error(error);
            message.error('Failed to delete charge');
        }
    };

    // Define columns(3) for the table 
    const columns = [
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount) => `PKR ${amount.toFixed(2)}` },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div>
                    <Button
                        type="primary"
                        style={{ marginRight: 8 }}
                        onClick={() => {
                            setEditingCharge(record);
                            setIsModalVisible(true);
                        }}  >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this charge?"
                        onConfirm={() => handleDelete(record)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <DeleteOutlined style={{ color: 'red', cursor: 'pointer' }} />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <DefaultLayout>
            <div style={{ padding: '20px' }}>
            <div className="d-flex justify-content-between">
                <h1>Charges List</h1>
                <Button
                    type="primary" onClick={() => setIsModalVisible(true)}>
                    Add Charge
                </Button>
            </div>

            <Table
                columns={columns} dataSource={chargesData}  rowKey="_id" style={{ marginTop: '20px' }} footer={() => (
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <strong>Total Amount: PKR {totalAmount.toFixed(2)}</strong>
                    </div>
                )}   />

            <Modal
                title={editingCharge ? 'Edit Charge' : 'Add New Charge'}
                visible={isModalVisible}
                onCancel={() => {
                    setEditingCharge(null);
                    setIsModalVisible(false);
                }}
                footer={null} >

                <Form
                    layout="vertical"
                    initialValues={editingCharge || { date: new Date().toISOString().slice(0, 10) }}
                    onFinish={handleFormSubmit}>
                    <Form.Item
                        label="Charge Description"
                        name="description"
                        rules={[{ required: true, message: 'Please enter charge description' }]} >
                        <Input placeholder="Enter charge description" />
                    </Form.Item>

                    <Form.Item
                        label="Date"
                        name="date"
                        rules={[{ required: true, message: 'Please enter date' }]} >
                        <Input type="date" placeholder="Enter date" />
                    </Form.Item>

                    <Form.Item
                        label="Amount"
                        name="amount"
                        rules={[{ required: true, message: 'Please enter amount' }]}  >
                        <Input type="number" min={0} placeholder="Enter amount" />
                    </Form.Item>
                    
                    <div className="d-flex justify-content-end">
                        <Button type="primary" htmlType="submit">
                            {editingCharge ? 'Save' : 'Add'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
        </DefaultLayout>
        
    );
};

export default ChargesPage;
