import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './shop.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ShopLayout from './components/shop/ShopLayout';
import ShopPage from './components/shop/ShopPage';
import ProductDetailPage from './components/shop/ProductDetailPage';
import CartPage from './components/shop/CartPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import EmployeesPage from './pages/EmployeesPage';
import CustomersPage from './pages/CustomersPage';
import InvoicesPage from './pages/InvoicesPage';
import BrandsPage from './pages/BrandsPage';
import CategoriesPage from './pages/CategoriesPage';
import PositionsPage from './pages/PositionsPage';
import SuppliersPage from './pages/SuppliersPage';
import LeavesPage from './pages/LeavesPage';
import SalariesPage from './pages/SalariesPage';
import ImportsPage from './pages/ImportsPage';
import ReviewsPage from './pages/ReviewsPage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* ═══ Customer-facing Shop ═══ */}
            <Route path="/shop" element={<ShopLayout />}>
              <Route index element={<ShopPage />} />
              <Route path="products" element={<ShopPage />} />
              <Route path="product/:id" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
            </Route>

            {/* ═══ Admin Dashboard ═══ */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="brands" element={<BrandsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="positions" element={<PositionsPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="leaves" element={<LeavesPage />} />
              <Route path="salaries" element={<SalariesPage />} />
              <Route path="imports" element={<ImportsPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>

            {/* Root redirects to shop */}
            <Route path="/" element={<Navigate to="/shop" replace />} />
            <Route path="*" element={<Navigate to="/shop" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
