import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import ChefDashboard from "./pages/ChefDashboard/ChefDashboard";
import { MenuProvider } from "./context/MenuContext";
import { OrderProvider } from "./context/OrderContext";

export default function App() {
  return (
    <MenuProvider>
      <OrderProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/chef" element={<ChefDashboard />} />
        </Routes>
      </OrderProvider>
    </MenuProvider>
  );
}