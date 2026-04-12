import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './shop.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
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
const RolesPage = lazy(() => import('./pages/RolesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
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

/* Permission-restricted route shorthand */
const P = ({ perm, children }) => <ProtectedRoute permission={perm}>{children}</ProtectedRoute>;

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

                {/* ═══ Admin Dashboard ═══ */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin" element={<DashboardLayout />}>
                  <Route index element={<HomePage />} />
                  
                  {/* Cá nhân (Public for all logged in staff/admin) */}
                  <Route path="profile" element={<MyProfilePage />} />
                  <Route path="my-leaves" element={<MyLeavePage />} />
                  <Route path="my-salary" element={<MySalaryPage />} />

                  {/* Permission-protected routes */}
                  <Route path="products" element={<P perm="products.read"><ProductsPage /></P>} />
                  <Route path="invoices" element={<P perm="invoices.read"><InvoicesPage /></P>} />
                  <Route path="customers" element={<P perm="customers.read"><CustomersPage /></P>} />
                  <Route path="leaves" element={<P perm="leaves.read"><LeavesPage /></P>} />
                  <Route path="employees" element={<P perm="employees.read"><EmployeesPage /></P>} />
                  <Route path="brands" element={<P perm="brands.read"><BrandsPage /></P>} />
                  <Route path="categories" element={<P perm="categories.read"><CategoriesPage /></P>} />
                  <Route path="positions" element={<P perm="positions.read"><PositionsPage /></P>} />
                  <Route path="salaries" element={<P perm="salaries.read"><SalariesPage /></P>} />
                  <Route path="reviews" element={<P perm="reviews.read"><ReviewsPage /></P>} />
                  <Route path="reports" element={<P perm="reports.read"><ReportsPage /></P>} />
                  <Route path="suppliers" element={<P perm="suppliers.read"><SuppliersPage /></P>} />
                  <Route path="imports" element={<P perm="imports.read"><ImportsPage /></P>} />
                  <Route path="users" element={<P perm="users.read"><UsersPage /></P>} />
                  <Route path="roles" element={<P perm="roles.read"><RolesPage /></P>} />
                  <Route path="settings" element={<P perm="settings.read"><SettingsPage /></P>} />
                </Route>

                {/* Root redirects to shop, staff redirects to admin */}
                <Route path="/staff/*" element={<Navigate to="/admin" replace />} />
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
