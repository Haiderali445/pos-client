import React from 'react';
import { Form, Input, Button ,message} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link ,Navigate,useNavigate} from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';


const RegistrationForm = () => {

  const dispatch = useDispatch();
  const nevigater = useNavigate();
  const handleSubmit = async (values) => {
    try {
      dispatch({
        type: "SHOW_LOADING",
      });
      await axios.post("/api/users/register",values);
      message.success("User registered successfully");
      dispatch({ type: "HIDE_LOADING" });
      nevigater('/login');  
  
    } catch (error) {
      message.error("cant register");

      console.error(error);
    }
  };

  return (
    <>
   <div className='Registore'>
   <section className="vh-50 ">
      <div className="container py-3 h-60">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card bg-dark text-white" style={{ borderRadius: "50px", boxShadow: "0px 0px 10px 10px lightgrey" }}>
              <div className="card-body p-4 text-center">
                <div className="mb-md-3 mt-md-2 pb-3">
                  <h2 className="fw-bold mb-1 text-uppercase">Register</h2>
                  <p className="text-white-50 mb-3">
                    Please enter your details to register!
                  </p>

                  <Form
                    layout="vertical" onFinish={handleSubmit} >
                    <Form.Item
                      name="name" label="Name"  rules={[{ required: true, message: 'Please enter your name!' }]} >
                      <Input prefix={<UserOutlined />} style={{ width: '100%' }} placeholder="Enter your name" />
                    </Form.Item>
                    
                    <Form.Item
                      name="userId" label="User ID" rules={[{ required: true, message: 'Please enter your user ID! ' }]} >
                      <Input prefix={<UserOutlined />} style={{ width: '100%' }} placeholder="Enter your user ID" />
                    </Form.Item>

                    <Form.Item
                      name="password" label="Password" rules={[{ required: true, message: 'Please enter your password!' }]} >
                      <Input.Password prefix={<LockOutlined />} style={{ width: '100%' }} placeholder="Enter your password" />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary" htmlType="submit" className="btn-lg px-4" style={{ borderRadius: "20px" }}  >
                        Register
                      </Button>
                    </Form.Item>
                  </Form>

                </div>
                <div>
                  <p className="mb-0">
                    Already have an account?{" "}
                    <Link to="/login" className="text-white-50 fw-bold">
                      Login
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
 
   </div>
    </>
  )
}

export default RegistrationForm
