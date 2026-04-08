import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType'); // 'staff' or 'customer'
    if (token) {
      loadUser(userType || 'staff');
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (type = 'staff') => {
    try {
      if (type === 'customer') {
        const userData = await authService.customerProfile();
        setUser({ ...userData, role: 'customer' });
      } else {
        const userData = await authService.getProfile();
        // Profile response now includes permissions array
        setUser(userData);
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
    } finally {
      setLoading(false);
    }
  };

  // Staff/admin login
  const login = async (username, password) => {
    const data = await authService.login({ username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('userType', 'staff');
    // data.user now includes permissions array
    setUser(data.user);
    return data;
  };

  // Customer login (phone + password)
  const customerLogin = async (phone, password) => {
    const data = await authService.customerLogin({ phone, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('userType', 'customer');
    setUser(data.user);
    return data;
  };

  // Customer register
  const customerRegister = async (formData) => {
    const data = await authService.customerRegister(formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('userType', 'customer');
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    setUser(null);
  };

  /**
   * Reload user data (e.g. after permission changes).
   * Also called when admin changes a user's role.
   */
  const refreshUser = async () => {
    const userType = localStorage.getItem('userType') || 'staff';
    await loadUser(userType);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, customerLogin, customerRegister, logout, loadUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
