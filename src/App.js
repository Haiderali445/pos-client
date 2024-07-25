import "antd/dist/reset.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import ItemPage from "./pages/Itempage";
import Cartpage from "./pages/Cartpage";
import LoginForm from "./pages/LoginForm";
import RegistrationForm from "./pages/RegistrationForm";
import ChangePasswordForm from "./pages/ChangePasswordForm";
import Billspage from "./pages/Billspage";
import Charges from "./pages/Charges"
import Dealers from "./pages/Dealerspage";
import StockPage from "./pages/Stockpage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/Items" element={<ItemPage />} />
        <Route path="/cart" element={<Cartpage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/bills" element={<Billspage />} />
        <Route path="/dealers" element={<Dealers />} />
        <Route path="/charges" element={<Charges />} />
        <Route path="/registration" element={<RegistrationForm />} />
        <Route path="/stock" element={<StockPage />} />

        <Route path="/ChangePasswordForm" element={<ChangePasswordForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
  
