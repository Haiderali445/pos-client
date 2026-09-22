import "antd/dist/reset.css";
import { ConfigProvider } from "antd";
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
import CustomerLedger from "./pages/CustomerLedger";
import PurchaseOrderPage from "./pages/PurchaseOrderPage";
import UserManagement from "./pages/UserManagement";
import TenantSettings from "./pages/TenantSettings";
import PrivateRoute from "./components/PrivateRoute";

const posTheme = {
  token: {
    colorPrimary: "#183c35",
    colorPrimaryHover: "#22614e",
    colorSuccess: "#2d8a55",
    colorWarning: "#faad14",
    colorError: "#cf1322",
    colorInfo: "#183c35",
    borderRadius: 8,
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      borderRadius: 8,
      fontWeight: 600,
    },
    Table: {
      borderRadius: 8,
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={posTheme}>
      <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/registration" element={<RegistrationForm />} />

        {/* Authenticated Workspace Routes (Accessible by all logged-in operators) */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/items" element={<ItemPage />} />
          <Route path="/Items" element={<ItemPage />} />
          <Route path="/cart" element={<Cartpage />} />
          <Route path="/bills" element={<Billspage />} />
          <Route path="/customers" element={<CustomerLedger />} />
          <Route path="/customer-ledger" element={<CustomerLedger />} />
          <Route path="/ChangePasswordForm" element={<ChangePasswordForm />} />
          <Route path="/change-password" element={<ChangePasswordForm />} />

          {/* Manager & Admin Controlled Routes */}
          <Route element={<PrivateRoute roles={["admin", "manager"]} />}>
            <Route path="/stock" element={<StockPage />} />
            <Route path="/purchase-orders" element={<PurchaseOrderPage />} />
            <Route path="/purchases" element={<PurchaseOrderPage />} />
            <Route path="/dealers" element={<Dealers />} />
            <Route path="/charges" element={<Charges />} />
          </Route>

          {/* Master Admin Strictly Controlled Routes */}
          <Route element={<PrivateRoute roles={["admin"]} />}>
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<TenantSettings />} />
            <Route path="/TenantSettings" element={<TenantSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </ConfigProvider>
  );
}

export default App;
