import React, { useState, useEffect } from "react";
import DefaultLayout from "../components/Defaultlayouts";
import axios from "axios";
import { useDispatch } from "react-redux";
import { Modal, Button, Table, Form, Input, Select, message } from "antd";
import { EyeOutlined, EditOutlined, PrinterOutlined, DeleteOutlined } from "@ant-design/icons";
import { format, isValid } from "date-fns";

const Billspage = () => {
    const [billsData, setBillsData] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [searchQuery, setSearchQuery] = useState(""); // Search query state
    const { Search } = Input;
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [eyeModalVisible, setEyeModalVisible] = useState(false);
    const dispatch = useDispatch();

    const fetchAllBills = async () => {
        try {
            dispatch({ type: "SHOW_LOADING" });
            const response = await axios.get("/api/bill/get-bill");
            setBillsData(response.data);
            dispatch({ type: "HIDE_LOADING" });
        } catch (error) {
            console.error("Error fetching bills:", error);
            dispatch({ type: "HIDE_LOADING" });
        }
    };

    useEffect(() => {
        fetchAllBills();
    }, []);

    const handleEditBill = async (values) => {
        try {
            const paidAmount = parseFloat(values.paidAmount);
            const totalAmount = parseFloat(values.totalAmount);

            const updatedBill = {
                ...selectedBill,
                costumerName: values.costumerName,
                costumerNumber: values.costumerNumber,
                paymentMethod: values.paymentMethod,
                paidAmount,
                totalAmount,
                cartItems: selectedBill.cartItems,
            };

            await axios.put(`/api/bill/edit-bill`, {
                billId: selectedBill._id,
                ...updatedBill,
            });

            message.success("Bill updated successfully!");
            fetchAllBills();
            setEditModalVisible(false);
            setSelectedBill(null);
        } catch (error) {
            console.error("Error updating bill:", error);
            message.error("Failed to update bill. Please check your input and try again.");
        }
    };

    // Handle search query changes
    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    // Filter bills based on search query
    const filteredBills = billsData.filter((bill) =>
        bill.costumerNumber.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Function to handle the delete action
    const handleDeleteBill = async (billId) => {
        try {
            // Send a DELETE request to the server with the bill ID
            await axios.delete(`/api/bill/delete-bill/${billId}`);

            // Display a success message
            message.success("Bill deleted successfully");

            // Refresh the list of bills
            fetchAllBills();
        } catch (error) {
            // Display an error message
            message.error("Failed to delete bill");
            console.error(error);
        }
    };

    // Define columns for the Table
    const columns = [
        { title: "ID", dataIndex: "_id" },
        { title: "Customer", dataIndex: "costumerName" },
        { title: "Contact", dataIndex: "costumerNumber" },
        { title: "Paid Amount", dataIndex: "paidAmount" },
        { title: "Total Amount", dataIndex: "totalAmount" },
        {
            title: "Actions",
            dataIndex: "_id",
            render: (id, record) => (
                <div>
                    <EditOutlined
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            setSelectedBill(record);
                            setEditModalVisible(true);
                        }}
                    />
                    <EyeOutlined
                        style={{ cursor: "pointer", marginLeft: "10px" }}
                        onClick={() => {
                            setSelectedBill(record);
                            setEyeModalVisible(true);
                        }}
                    />
                    <DeleteOutlined
                        style={{ cursor: "pointer", color: "red", marginLeft: "10px" }}
                        onClick={() => handleDeleteBill(id)}
                    />
                </div>
            ),
        },
    ];

    return (
        <DefaultLayout>
            <div className="d-flex justify-content-between">
                <h1>Invoice List</h1>
            </div>
            <div style={{ marginBottom: '16px' }}>
                <Search
                    placeholder="Search by customer phone number..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    style={{ width: '30%', fontSize: "16px" }}
                />
            </div>

            <Table columns={columns} dataSource={filteredBills} bordered />

            {editModalVisible && selectedBill && (
                <Modal
                    title="Edit Bill"
                    visible={editModalVisible}
                    onCancel={() => {
                        setEditModalVisible(false);
                        setSelectedBill(null);
                    }}
                    footer={null}
                >
                    <Form
                        layout="vertical"
                        initialValues={{
                            costumerName: selectedBill.costumerName,
                            costumerNumber: selectedBill.costumerNumber,
                            paymentMethod: selectedBill.paymentMethod,
                            paidAmount: selectedBill.paidAmount,
                            totalAmount: selectedBill.totalAmount,
                        }}
                        onFinish={handleEditBill}
                    >
                        <Form.Item
                            name="costumerName"
                            label="Customer Name"
                            rules={[{ required: true, message: "Please enter customer name" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="costumerNumber"
                            label="Customer Number"
                            rules={[{ required: true, message: "Please enter customer number" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="paymentMethod"
                            label="Payment Method"
                            rules={[{ required: true, message: "Please select a payment method" }]}
                        >
                            <Select>
                                <Select.Option value="cash">Cash</Select.Option>
                                <Select.Option value="card">Card</Select.Option>
                                <Select.Option value="borrow">Borrow</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="totalAmount"
                            label="Total Amount"
                            rules={[{ required: true, message: "Please enter total amount" }]}
                        >
                            <Input type="number" min={0} />
                        </Form.Item>
                        <Form.Item
                            name="paidAmount"
                            label="Paid Amount"
                            rules={[{ required: true, message: "Please enter paid amount" }]}
                        >
                            <Input type="number" min={0} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Save
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            )}

            {eyeModalVisible && selectedBill && (
                <Modal
                    title="Bill Details"
                    visible={eyeModalVisible}
                    onCancel={() => {
                        setEyeModalVisible(false);
                        setSelectedBill(null);
                    }}
                    footer={null}
                    style={{ maxWidth: "400px" }}
                >
                    <div style={{ textAlign: "center" }}>
                        <img
                            src="https://img.freepik.com/free-vector/gradient-mechanical-engineering-logo_23-2150053263.jpg"
                            alt="POS Logo"
                            style={{ width: "100px", marginBottom: "10px" }}
                        />

                        <div style={{ marginBottom: "10px" }}>
                            <p>
                                <strong>Bill Number:</strong> {selectedBill._id}
                            </p>
                            <p>
                                <strong>Date:</strong> {isValid(new Date(selectedBill.date)) ? format(new Date(selectedBill.date), "dd/MM/yyyy") : "Invalid Date"}
                            </p>
                        </div>

                        <div style={{ textAlign: "left" }}>
                            <p><strong>Customer Name:</strong> {selectedBill.costumerName}</p>
                            <p><strong>Customer Number:</strong> {selectedBill.costumerNumber}</p>
                        </div>

                        <div style={{ borderTop: "1px solid black", paddingTop: "10px" }}>
                            <h4>Items:</h4>
                            <ul style={{ textAlign: "left" }}>
                                {selectedBill.cartItems?.map((item) => (
                                    <li key={item._id}>
                                        {item.name} - {item.quantity} = PKR {item.salePrice}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ borderTop: "1px solid black", paddingTop: "10px" }}>
                            <p><strong>Paid Amount:</strong> PKR {selectedBill.paidAmount}</p>
                            <p><strong>Total Amount:</strong> PKR {selectedBill.totalAmount}</p>
                        </div>

                        <div style={{ marginTop: "10px" }}>
                            <PrinterOutlined
                                style={{ fontSize: "32px", cursor: "pointer" }}
                                onClick={() => window.print()}
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </DefaultLayout>
    );
};

export default Billspage;
