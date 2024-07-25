import React, { useEffect, useState } from "react";
import DefaultLayout from "../components/Defaultlayouts";
import axios from "axios";
import { useDispatch } from "react-redux";
import { Modal, Button, Table, Form, Input, message, Popconfirm } from "antd";
import { DeleteOutlined, EditOutlined, PlusSquareOutlined } from "@ant-design/icons";

const DealerPage = () => {
    const [dealersData, setDealersData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { Search } = Input; 
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDealer, setEditingDealer] = useState(null);
    const dispatch = useDispatch();

    const fetchAllDealers = async () => {
        try {
            const response = await axios.get('/api/dealers/get-dealers');
            setDealersData(response.data);
        } catch (error) {
            console.error(error);
            message.error("Failed to fetch dealers");
        }
    };

    useEffect(() => {
        fetchAllDealers();
    }, []);

    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    const filteredDealers = dealersData.filter((dealer) =>
        dealer.contactName.toString().includes(searchQuery)
    );

    const handleUpdate = async (values) => {
        try {
            const { dealerId } = editingDealer; 

            const response = await axios.put('/api/dealers/edit-dealer', {
                ...values,
                dealerId
            });

            message.success("Dealer updated successfully");
            fetchAllDealers(); 
            setIsModalVisible(false);
            setEditingDealer(null);
        } catch (error) {
            console.error(error);
            message.error("Failed to update dealer");
        }
    };

    const handleDelete = async (dealer) => {
        try {
            await axios.post('/api/dealers/delete-dealer', { dealerId: dealer._id });
            message.success("Dealer deleted successfully");
            fetchAllDealers();
        } catch (error) {
            console.error(error);
            message.error("Failed to delete dealer");
        }
    };

    const handleFormSubmit = async (values) => {
        if (editingDealer) {
            await handleUpdate(values);
        } else {
            try {
                const response = await axios.post('/api/dealers/add-dealer', values);
                message.success("Dealer added successfully");
                fetchAllDealers();
                setIsModalVisible(false);
                setEditingDealer(null);
            } catch (error) {
                console.error(error);
                message.error("Failed to add dealer");
            }
        }
    };

    const columns = [
        { title: "Dealer Name", dataIndex: "dealerName" },
        { title: "Contact Name", dataIndex: "contactName" },
        { title: "Shop Name", dataIndex: "shopName" },
        { title: "Address", dataIndex: "address" },
        { title: "Products", dataIndex: "products" },
        {
            title: "Actions",
            dataIndex: "_id",
            render: (id, dealer) => (
                <div>
                    <Popconfirm
                        title="Are you sure you want to delete this dealer?"
                        onConfirm={() => handleDelete(dealer)}
                    >
                        <DeleteOutlined style={{ color: 'red', cursor: 'pointer' }}/>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <DefaultLayout>
            <div className="d-flex justify-content-between">
                <h1>Dealers List</h1>

                <Button icon={<PlusSquareOutlined />} type="primary" onClick={() => setIsModalVisible(true)}>
                    Add Dealer
                </Button>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <Search
                    placeholder="Search by dealer contact name..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    style={{ width: '30%' }}
                />
            </div>

            <Table columns={columns} dataSource={filteredDealers} bordered />

            <Modal
                title={editingDealer ? "Edit Dealer" : "Add New Dealer"}
                visible={isModalVisible}
                onCancel={() => {
                    setEditingDealer(null);
                    setIsModalVisible(false);
                }}
                footer={null}
            >
                <Form
                    layout="vertical"
                    initialValues={editingDealer}
                    onFinish={handleFormSubmit}
                >
                    <Form.Item
                        label="Dealer Name"
                        name="dealerName"
                        rules={[{ required: true, message: "Please enter dealer name" }]}
                    >
                        <Input placeholder="Enter dealer name" />
                    </Form.Item>
                    <Form.Item
                        label="Contact Name"
                        name="contactName"
                        rules={[{ required: true, message: "Please enter contact name" }]}
                    >
                        <Input placeholder="Enter contact name" />
                    </Form.Item>
                    <Form.Item
                        label="Shop Name"
                        name="shopName"
                        rules={[{ required: true, message: "Please enter shop name" }]}
                    >
                        <Input placeholder="Enter shop name" />
                    </Form.Item>
                    <Form.Item
                        label="Address"
                        name="address"
                        rules={[{ required: true, message: "Please enter address" }]}
                    >
                        <Input placeholder="Enter address" />
                    </Form.Item>
                    <Form.Item
                        label="Products"
                        name="products"
                    >
                        <Input placeholder="Enter products" />
                    </Form.Item>
                    <div className="d-flex justify-content-end">
                        <Button type="primary" htmlType="submit">
                            {editingDealer ? "Save" : "Add"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </DefaultLayout>
    );
};

export default DealerPage;
