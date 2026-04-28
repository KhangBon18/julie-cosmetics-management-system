import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
const AttendancesPage = lazy(() => import('./pages/AttendancesPage'));
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
const MyAttendancePage = lazy(() => import('./pages/staff/MyAttendancePage'));
const MySalaryPage = lazy(() => import('./pages/staff/MySalaryPage'));

/* Loading fallback */
const Loading = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'40vh'}}>
    <div className="spinner" />
  </div>
);

/* Permission-restricted route shorthand */
const P = ({ perm, workspaceKeys, allowedRoles, children }) => (
  <ProtectedRoute permission={perm} workspaceKeys={workspaceKeys} allowedRoles={allowedRoles}>
    {children}
  </ProtectedRoute>
);

const renderInternalWorkspaceRoutes = () => (
  <>
    <Route index element={<HomePage />} />

    <Route path="profile" element={<P allowedRoles={['manager', 'staff', 'warehouse', 'employee', 'staff_portal']}><MyProfilePage /></P>} />
    <Route path="my-leaves" element={<P allowedRoles={['manager', 'staff', 'warehouse', 'employee', 'staff_portal']}><MyLeavePage /></P>} />
    <Route path="my-attendance" element={<P allowedRoles={['manager', 'staff', 'warehouse', 'employee', 'staff_portal']} workspaceKeys={['hr', 'warehouse', 'business', 'staff']}><MyAttendancePage /></P>} />
    <Route path="my-salary" element={<P allowedRoles={['manager', 'staff', 'warehouse', 'employee', 'staff_portal']}><MySalaryPage /></P>} />

    <Route path="products" element={<P perm="products.read"><ProductsPage /></P>} />
    <Route path="invoices" element={<P perm="invoices.read"><InvoicesPage /></P>} />
    <Route path="customers" element={<P perm="customers.read"><CustomersPage /></P>} />
    <Route path="leaves" element={<P perm="leaves.read"><LeavesPage /></P>} />
    <Route path="attendances" element={<P perm="attendances.read" workspaceKeys={['admin', 'hr']}><AttendancesPage /></P>} />
    <Route path="employees" element={<P perm="employees.read"><EmployeesPage /></P>} />
    <Route path="brands" element={<P perm="brands.read"><BrandsPage /></P>} />
    <Route path="categories" element={<P perm="categories.read"><CategoriesPage /></P>} />
    <Route path="positions" element={<P perm="positions.read"><PositionsPage /></P>} />
    <Route path="salaries" element={<P perm="salaries.read"><SalariesPage /></P>} />
    <Route path="reviews" element={<P perm="reviews.read"><ReviewsPage /></P>} />
    <Route path="reports" element={<P perm="reports.read"><ReportsPage /></P>} />
    <Route path="suppliers" element={<P perm="suppliers.read"><SuppliersPage /></P>} />
    <Route path="imports" element={<P perm="imports.read"><ImportsPage /></P>} />
    <Route path="users" element={<P perm="users.read" workspaceKeys={['admin']}><UsersPage /></P>} />
    <Route path="roles" element={<P perm="roles.read" workspaceKeys={['admin']}><RolesPage /></P>} />
    <Route path="settings" element={<P perm="settings.read" workspaceKeys={['admin']}><SettingsPage /></P>} />
  </>
);

const ADMIN_TOAST_CONTAINER_ID = 'admin-toast-container';

function AdminToastCloseButton({ closeToast }) {
  return (
    <button
      type="button"
      className="admin-toast-close"
      aria-label="Đóng thông báo"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        closeToast?.(event);
      }}
    >
      ×
    </button>
  );
}

/* ─── Route-aware Toast — shop vs admin themes ─── */
function SmartToast() {
  const { pathname } = useLocation();
  const isShop = pathname.startsWith('/shop');

  if (isShop) {
    // Shop: light cream/rose theme matching Julie brand
    return (
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        limit={3}
        toastClassName="julie-toast"
        progressClassName="julie-toast-progress"
        style={{ top: '16px', width: 'auto', maxWidth: '400px', minWidth: '280px' }}
      />
    );
  }

  // Admin / HR / Staff / Warehouse / Business: vibrant system theme
  return (
    <ToastContainer
      containerId={ADMIN_TOAST_CONTAINER_ID}
      className="admin-toast-container"
      position="top-center"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick={false}
      pauseOnFocusLoss={false}
      draggable={false}
      pauseOnHover
      theme="light"
      limit={3}
      toastClassName="admin-toast"
      bodyClassName="admin-toast-body"
      progressClassName="admin-toast-progress"
      closeButton={AdminToastCloseButton}
    />
  );
}

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
            {/* SmartToast must be inside BrowserRouter to use useLocation */}
            <SmartToast />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
