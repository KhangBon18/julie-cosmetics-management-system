import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './shop.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import StaffLayout from './components/layout/StaffLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ShopLayout from './components/shop/ShopLayout';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// Code splitting — lazy load heavy pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const PositionsPage = lazy(() => import('./pages/PositionsPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const LeavesPage = lazy(() => import('./pages/LeavesPage'));
const SalariesPage = lazy(() => import('./pages/SalariesPage'));
const ImportsPage = lazy(() => import('./pages/ImportsPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const StorefrontHome = lazy(() => import('./components/shop/StorefrontHome'));
const ShopPage = lazy(() => import('./components/shop/ShopPage'));
const ProductDetailPage = lazy(() => import('./components/shop/ProductDetailPage'));
const CartPage = lazy(() => import('./components/shop/CartPage'));
const CheckoutPage = lazy(() => import('./components/shop/CheckoutPage'));
const ShopAuthPage = lazy(() => import('./components/shop/ShopAuthPage'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const MyProfilePage = lazy(() => import('./pages/staff/MyProfilePage'));
const MyLeavePage = lazy(() => import('./pages/staff/MyLeavePage'));
const MySalaryPage = lazy(() => import('./pages/staff/MySalaryPage'));

/* Loading fallback */
const Loading = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'40vh'}}>
    <div className="spinner" />
  </div>
);

/* Shorthand wrapper for role-restricted routes */
const R = ({ roles, children }) => <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>;

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* ═══ Customer-facing Shop ═══ */}
                <Route path="/shop" element={<ShopLayout />}>
                  <Route index element={<StorefrontHome />} />
                  <Route path="products" element={<ShopPage />} />
                  <Route path="product/:id" element={<ProductDetailPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="auth" element={<ShopAuthPage />} />
                </Route>

                {/* ═══ Staff Portal ═══ */}
                <Route path="/staff" element={<StaffLayout />}>
                  <Route index element={<StaffDashboard />} />
                  <Route path="profile" element={<MyProfilePage />} />
                  <Route path="leaves" element={<MyLeavePage />} />
                  <Route path="salaries" element={<MySalaryPage />} />
                </Route>

                {/* ═══ Admin Dashboard ═══ */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin" element={<DashboardLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="leaves" element={<LeavesPage />} />
                  {/* Manager + Admin only */}
                  <Route path="employees" element={<R roles={['admin','manager']}><EmployeesPage /></R>} />
                  <Route path="brands" element={<R roles={['admin','manager']}><BrandsPage /></R>} />
                  <Route path="categories" element={<R roles={['admin','manager']}><CategoriesPage /></R>} />
                  <Route path="positions" element={<R roles={['admin','manager']}><PositionsPage /></R>} />
                  <Route path="salaries" element={<R roles={['admin','manager']}><SalariesPage /></R>} />
                  <Route path="reviews" element={<R roles={['admin','manager']}><ReviewsPage /></R>} />
                  <Route path="reports" element={<R roles={['admin','manager']}><ReportsPage /></R>} />
                  {/* Warehouse + Manager + Admin */}
                  <Route path="suppliers" element={<R roles={['admin','manager','warehouse']}><SuppliersPage /></R>} />
                  <Route path="imports" element={<R roles={['admin','manager','warehouse']}><ImportsPage /></R>} />
                  {/* Admin only */}
                  <Route path="users" element={<R roles={['admin']}><UsersPage /></R>} />
                </Route>

                {/* Root redirects to shop */}
                <Route path="/" element={<Navigate to="/shop" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
