import "antd/dist/reset.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import ItemPage from "./pages/Itempage";
import Cartpage from "./pages/Cartpage";
import LoginForm from "./pages/LoginForm";
import RegistrationForm from "./pages/RegistrationForm";
import ChangePasswordForm from "./pages/ChangePasswordForm";
import Billspage from "./pages/Billspage";
import Charges from "./pages/Charges";
import Dealers from "./pages/Dealerspage";
import StockPage from "./pages/Stockpage";
import UserManagement from "./pages/UserManagement";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/registration" element={<RegistrationForm />} />

        {/* Authenticated Workspace Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/items" element={<ItemPage />} />
          <Route path="/Items" element={<ItemPage />} />
          <Route path="/cart" element={<Cartpage />} />
          <Route path="/bills" element={<Billspage />} />
          <Route path="/dealers" element={<Dealers />} />
          <Route path="/charges" element={<Charges />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/ChangePasswordForm" element={<ChangePasswordForm />} />
          <Route path="/change-password" element={<ChangePasswordForm />} />

          {/* Admin Strictly Controlled Routes */}
          <Route element={<PrivateRoute roles={["admin"]} />}>
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
