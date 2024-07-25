import React, { useEffect, useState } from "react";
import DefaultLayout from "../components/Defaultlayouts";
import axios from "axios";
import { useDispatch } from "react-redux";
import { Modal, Button, Table, Form, Input, message, Select, Popconfirm } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const { Option } = Select;

const ItemPage = () => {
  const [itemsData, setItemsData] = useState([]);
  const [popupModal, setPopupModal] = useState(false);
  const [editItems, setEditItems] = useState(null);
  const dispatch = useDispatch();

  // Fetch all items data
  const getAllItems = async () => {
    try {
      dispatch({ type: "SHOW_LOADING" });
      const { data } = await axios.get("/api/items/get-item");
      setItemsData(data);
      dispatch({ type: "HIDE_LOADING" });
    } catch (error) {
      console.error("Failed to fetch items:", error);
      dispatch({ type: "HIDE_LOADING" });
    }
  };

  useEffect(() => {
    getAllItems();
  }, []);

  // Handle item deletion
  const handleDelete = async (record) => {
    try {
      dispatch({ type: "SHOW_LOADING" });
      await axios.post("/api/items/delete-item", { itemId: record._id });
      message.success("Item deleted successfully");
      await getAllItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      dispatch({ type: "HIDE_LOADING" });
    }
  };

  const columns = [
    
    { title: "Name", dataIndex: "name" },
    {
      title: "Image",
      dataIndex: "image",
      render: (image, record) => (
        <img src={image} alt={record.name} height="60" width="60" />
      ),
    },
    { title: "Purchase Price", dataIndex: "purchasePrice", key: "purchasePrice" },
    { title: "Stock", dataIndex: "stock", key: "stock" },
    {
      title: "Actions",
      dataIndex: "_id",
      render: (id, record) => (
        <div>
          <EditOutlined
            style={{ cursor: "pointer", marginRight: 10 }}
            onClick={() => {
              setEditItems(record);
              setPopupModal(true);
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete(record)}
          >
            <DeleteOutlined style={{ color: 'red', cursor: 'pointer' }} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      dispatch({ type: "SHOW_LOADING" });

      if (editItems === null) {
        // new item add karni ho
        await axios.post("/api/items/add-item", values);
        message.success("Item added successfully");
      } else {
        // Updating  item ko karna existing system 
        await axios.put("/api/items/edit-item", {
          ...values,
          itemId: editItems._id,
        });
        message.success("Item updated successfully");
      }

      await getAllItems();
      setPopupModal(false);
      setEditItems(null);
    } catch (error) {
      console.error("Failed to save item:", error);
    } finally {
      dispatch({ type: "HIDE_LOADING" });
    }
  };

  return (
    <DefaultLayout>
      <div className="d-flex justify-content-between">
        <h1>Item List</h1>
        <Button type="primary" onClick={() => setPopupModal(true)}>
          Add Item
        </Button>
      </div>

      <Table columns={columns} dataSource={itemsData} bordered />

      {popupModal && (

        <Modal
          title={editItems ? "Edit Item" : "Add New Item"}
          visible={popupModal} onCancel={() => { setEditItems(null); setPopupModal(false); }}
          footer={null} >

          <Form
            layout="vertical"  initialValues={editItems || { purchasePrice: '', salePrice: '' }} onFinish={handleSubmit}> 
            <Form.Item
              label="Name"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Please enter the item name",
                },
                {
                  pattern: /^[a-zA-Z\s]+$/,
                  message: "Please enter only letters and spaces",
                }, ]} >
              <Input placeholder="Enter item name" />
            </Form.Item>

            <Form.Item
              label="Purchase Price"
              name="purchasePrice" >
              <Input type="number" placeholder="Enter purchase price" />
            </Form.Item>

            <Form.Item
              label="Sale Price"
              name="salePrice">
              <Input type="number" placeholder="Enter sale price" />
            </Form.Item>
            
            <Form.Item
              label="Stock :"
              name="stock">
              <Input type="number" placeholder="Enter your stock" />
            </Form.Item>

            <Form.Item
              label="Image URL"
              name="image"
              rules={[
                {
                  required: true,
                  message: "Please enter the image URL",
                },
                {
                  type: "url",
                  message: "Please enter a valid URL",
                },]} >
              <Input type="url" placeholder="Enter image URL" />
            </Form.Item>

            <Form.Item name="category" label="Category">
              <Select placeholder="Select category">
                <Option value="Shower">Shower</Option>
                <Option value="Sink">Sink</Option>
                <Option value="Tap">Tap</Option>
                <Option value="Nails">Nails</Option>          
                <Option value="Pipe">Pipe</Option>
                <Option value="Water Tank">Water Tank</Option>
                <Option value="Elbow">Elbow</Option>
                <Option value="Others">Others</Option>
              </Select>
            </Form.Item>

            <div className="d-flex justify-content-end">
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </DefaultLayout>
  );
};

export default ItemPage;
