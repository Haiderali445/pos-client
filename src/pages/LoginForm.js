import React, { useState } from 'react';
import { Form, Input, Button, Modal, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      dispatch({ type: "SHOW_LOADING" });

      const response = await axios.post("/api/users/login", values);

      if (response.status === 200) {
        message.success("User logged in successfully");
        dispatch({ type: "HIDE_LOADING" });
        navigate('/');
      } else {
        message.error("User not found or incorrect credentials");
      }
    } catch (error) {
      message.error("Incorrect Credential");
      console.error(error);
    }
  };

  const handleForgotPassword = async (values) => {
    try {
      setLoading(true);
      
      const response = await axios.post("/api/users/reset-password", values);
      
      if (response.status === 200) {
        message.success("Password has been updated successfully");
      } else {
        message.error("Failed to update the password");
      }
    } catch (error) {
      message.error("Oops! Something went wrong. Please try again later.");
      console.error(error);
    } finally {
      setLoading(false);
      setVisible(false);
    }
  };

  return (
    <div className='Login'>
      <section className="vh-50 ">
        <div className="container py-3 h-60">
          <div className="row d-flex justify-content-center align-items-center h-100">
            <div className="col-12 col-md-8 col-lg-6 col-xl-5">
              <div className="card bg-dark text-white" style={{ borderRadius: "50px", boxShadow: "0px 0px 10px 10px lightgrey" }}>
                <div className="card-body p-4 text-center">
                  <div className="mb-md-3 mt-md-2 pb-3">
                    <h2 className="fw-bold mb-1 text-uppercase">Login</h2>
                    <p className="text-white-5 mb-3">
                      Please Enter Your Login and Password!
                    </p>

                    <Form layout="vertical" onFinish={handleSubmit}>
                      <Form.Item name="userId" label="USER ID" rules={[{ required: true, message: 'Please enter your user ID!' }]}>
                        <Input prefix={<UserOutlined />} style={{ width: '100%' }} placeholder='ENTER USER ID' />
                      </Form.Item>

                      <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password!' }]}>
                        <Input.Password style={{ width: '100%' }} placeholder='ENTER PASSWORD' />
                      </Form.Item>

                      <p className="small mb-3">
                        <Button type="link" onClick={() => setVisible(true)}>Forgot password?</Button>
                      </p>

                      <Form.Item>
                        <Button type="primary" htmlType="submit" className="btn-lg px-4" style={{ borderRadius: "20px" }}>
                          Login
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                  <div>
                    <p className="mb-0">
                      Don't have an account?{' '}
                      <Link to="/Registration" className="text-white-50 fw-bold">
                        Sign Up
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Modal
        title="Forgot Password"
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" loading={loading} onClick={() => form.submit()}>
            Save
          </Button>,
        ]}
      >
        <Form form={form} onFinish={handleForgotPassword}>
          <Form.Item name="userId" label="User ID" rules={[{ required: true, message: 'Please enter your user ID!' }]}>
            <Input prefix={<UserOutlined />} style={{ width: '100%' }} placeholder='ENTER USER ID' />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter your name!' }]}>
            <Input prefix={<UserOutlined />} style={{ width: '100%' }} placeholder='ENTER YOUR NAME' />
          </Form.Item>
          <Form.Item name="newPassword" label="New Password" rules={[{ required: true, message: 'Please enter your new password!' }]}>
            <Input.Password prefix={<LockOutlined />} style={{ width: '100%' }} placeholder='ENTER NEW PASSWORD' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LoginForm;
