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
const CustomerProfilePage = lazy(() => import('./components/shop/CustomerProfilePage'));
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
const P = ({ perm, workspaceKeys, children }) => (
  <ProtectedRoute permission={perm} workspaceKeys={workspaceKeys}>
    {children}
  </ProtectedRoute>
);

const renderInternalWorkspaceRoutes = () => (
  <>
    <Route index element={<HomePage />} />

    <Route path="profile" element={<MyProfilePage />} />
    <Route path="my-leaves" element={<MyLeavePage />} />
    <Route path="my-salary" element={<MySalaryPage />} />

    <Route path="products" element={<P perm="products.read" workspaceKeys={['admin', 'warehouse']}><ProductsPage /></P>} />
    <Route path="invoices" element={<P perm="invoices.read" workspaceKeys={['admin', 'business']}><InvoicesPage /></P>} />
    <Route path="customers" element={<P perm="customers.read" workspaceKeys={['admin', 'business']}><CustomersPage /></P>} />
    <Route path="leaves" element={<P perm="leaves.read" workspaceKeys={['admin', 'hr']}><LeavesPage /></P>} />
    <Route path="employees" element={<P perm="employees.read" workspaceKeys={['admin', 'hr']}><EmployeesPage /></P>} />
    <Route path="brands" element={<P perm="brands.read" workspaceKeys={['admin', 'warehouse']}><BrandsPage /></P>} />
    <Route path="categories" element={<P perm="categories.read" workspaceKeys={['admin', 'warehouse']}><CategoriesPage /></P>} />
    <Route path="positions" element={<P perm="positions.read" workspaceKeys={['admin', 'hr']}><PositionsPage /></P>} />
    <Route path="salaries" element={<P perm="salaries.read" workspaceKeys={['admin', 'hr']}><SalariesPage /></P>} />
    <Route path="reviews" element={<P perm="reviews.read" workspaceKeys={['admin', 'business']}><ReviewsPage /></P>} />
    <Route path="reports" element={<P perm="reports.read" workspaceKeys={['admin', 'hr', 'warehouse', 'business']}><ReportsPage /></P>} />
    <Route path="suppliers" element={<P perm="suppliers.read" workspaceKeys={['admin', 'warehouse']}><SuppliersPage /></P>} />
    <Route path="imports" element={<P perm="imports.read" workspaceKeys={['admin', 'warehouse']}><ImportsPage /></P>} />
    <Route path="users" element={<P perm="users.read" workspaceKeys={['admin']}><UsersPage /></P>} />
    <Route path="roles" element={<P perm="roles.read" workspaceKeys={['admin']}><RolesPage /></P>} />
    <Route path="settings" element={<P perm="settings.read" workspaceKeys={['admin']}><SettingsPage /></P>} />
  </>
);

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
                  <Route path="profile" element={<CustomerProfilePage />} />
                </Route>

                {/* ═══ Admin Dashboard ═══ */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin" element={<DashboardLayout />}>
                  {renderInternalWorkspaceRoutes()}
                </Route>
                <Route path="/hr" element={<DashboardLayout />}>
                  {renderInternalWorkspaceRoutes()}
                </Route>
                <Route path="/warehouse" element={<DashboardLayout />}>
                  {renderInternalWorkspaceRoutes()}
                </Route>
                <Route path="/business" element={<DashboardLayout />}>
                  {renderInternalWorkspaceRoutes()}
                </Route>
                <Route path="/staff" element={<DashboardLayout />}>
                  {renderInternalWorkspaceRoutes()}
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
