import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

/**
 * AuthProvider tách biệt hoàn toàn 2 session:
 * - Staff/Admin: localStorage key "staff_token" → state "user"
 * - Customer:    localStorage key "customer_token" → state "customerUser"
 *
 * Login staff không ảnh hưởng customer và ngược lại.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);             // Staff/Admin
  const [customerUser, setCustomerUser] = useState(null); // Customer
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let pending = 0;
    const done = () => { pending--; if (pending <= 0) setLoading(false); };

    const staffToken = localStorage.getItem('staff_token');
    const customerToken = localStorage.getItem('customer_token');

    if (staffToken) pending++;
    if (customerToken) pending++;
    if (pending === 0) { setLoading(false); return; }

    if (staffToken) loadStaffUser().finally(done);
    if (customerToken) loadCustomerUser().finally(done);
  }, []);

  // ── Load staff profile ──
  const loadStaffUser = async () => {
    try {
      const userData = await authService.getProfile();
      setUser(userData);
    } catch {
      localStorage.removeItem('staff_token');
      setUser(null);
    }
  };

  // ── Load customer profile ──
  const loadCustomerUser = async () => {
    try {
      const userData = await authService.customerProfile();
      setCustomerUser({ ...userData, role: 'customer' });
    } catch {
      localStorage.removeItem('customer_token');
      setCustomerUser(null);
    }
  };

  // ── Staff/admin login ──
  const login = async (username, password) => {
    const data = await authService.login({ username, password });
    localStorage.setItem('staff_token', data.token);
    setUser(data.user);
    return data;
  };

  // ── Customer login (phone + password) ──
  const customerLogin = async (phone, password) => {
    const data = await authService.customerLogin({ phone, password });
    localStorage.setItem('customer_token', data.token);
    setCustomerUser(data.user);
    return data;
  };

  // ── Customer register ──
  const customerRegister = async (formData) => {
    const data = await authService.customerRegister(formData);
    localStorage.setItem('customer_token', data.token);
    setCustomerUser(data.user);
    return data;
  };

  // ── Staff logout (only clears staff session) ──
  const logout = () => {
    localStorage.removeItem('staff_token');
    setUser(null);
  };

  // ── Customer logout (only clears customer session) ──
  const customerLogout = () => {
    localStorage.removeItem('customer_token');
    setCustomerUser(null);
  };

  // ── Refresh staff user data ──
  const refreshUser = async () => {
    if (localStorage.getItem('staff_token')) {
      await loadStaffUser();
    }
  };

  return (
    <AuthContext.Provider value={{
      user, customerUser, loading,
      login, customerLogin, customerRegister,
      logout, customerLogout,
      loadUser: loadStaffUser, refreshUser, refreshCustomer: loadCustomerUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
