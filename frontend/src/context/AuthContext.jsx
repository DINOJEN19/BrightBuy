// frontend/src/context/AuthContext.jsx
// Centralized authentication context for BrightBuy. Owned by Person 1.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../features/auth/api';
import {
  DEMO_ACCOUNTS,
  getRoleFromToken,
  setStorageItem,
  getStorageItem,
  removeStorageItem,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStorageItem('brightbuy_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = getStorageItem('brightbuy_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    const storedRole = getStorageItem('brightbuy_role');
    if (storedRole) return storedRole;
    const currentToken = getStorageItem('brightbuy_token');
    return getRoleFromToken(currentToken) || 'GUEST';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync state whenever external auth-change events occur
  const syncStateFromStorage = useCallback(() => {
    const curToken = getStorageItem('brightbuy_token') || null;
    let loadedUser = null;
    try {
      const stored = getStorageItem('brightbuy_user');
      if (stored) loadedUser = JSON.parse(stored);
    } catch {
      loadedUser = null;
    }
    const curRole = getStorageItem('brightbuy_role') || getRoleFromToken(curToken) || 'GUEST';

    setToken(curToken);
    setUser(loadedUser);
    setRole(curRole);
  }, []);

  useEffect(() => {
    // Initial verification
    const initAuth = async () => {
      const curToken = getStorageItem('brightbuy_token');
      if (curToken) {
        try {
          const res = await authApi.getProfile();
          if (res?.data?.data) {
            const customer = res.data.data;
            const userRole = customer.role || getRoleFromToken(curToken) || 'CUSTOMER';
            const updatedUser = { ...customer, role: userRole };
            setUser(updatedUser);
            setRole(userRole);
            setStorageItem('brightbuy_user', JSON.stringify(updatedUser));
            setStorageItem('brightbuy_role', userRole);
          }
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid profile fetch:', err.message);
          // Token is invalid/expired
          if (err.response?.status === 401) {
            removeStorageItem('brightbuy_token');
            removeStorageItem('brightbuy_user');
            removeStorageItem('brightbuy_role');
            setToken(null);
            setUser(null);
            setRole('GUEST');
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleAuthChange = () => {
      syncStateFromStorage();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [syncStateFromStorage]);

  /**
   * Log in with email and password
   */
  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: newToken, customer } = res.data.data;

    const userRole = customer.role || getRoleFromToken(newToken) || 'CUSTOMER';
    const fullUser = { ...customer, role: userRole };

    setStorageItem('brightbuy_token', newToken);
    setStorageItem('brightbuy_role', userRole);
    setStorageItem('brightbuy_user', JSON.stringify(fullUser));

    setToken(newToken);
    setUser(fullUser);
    setRole(userRole);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'));
    }

    return fullUser;
  };

  /**
   * Register a new customer and automatically log them in
   */
  const register = async (userData) => {
    const regRes = await authApi.register(userData);
    // After registration succeeds, log in with credentials
    if (userData.password) {
      return await login(userData.email, userData.password);
    }
    return regRes.data?.data;
  };

  /**
   * Log out of current session
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort logout
    } finally {
      removeStorageItem('brightbuy_token');
      removeStorageItem('brightbuy_role');
      removeStorageItem('brightbuy_user');
      setToken(null);
      setUser(null);
      setRole('GUEST');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }
    }
  };

  /**
   * Quick-login helper for demo/testing
   */
  const quickLogin = async (targetRole = 'CUSTOMER') => {
    const account = DEMO_ACCOUNTS[targetRole] || DEMO_ACCOUNTS.CUSTOMER;
    return await login(account.email, account.password);
  };

  /**
   * Update profile fields in state and storage
   */
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedFields };
      setStorageItem('brightbuy_user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  /**
   * Re-fetches the latest profile data
   */
  const refreshProfile = async () => {
    try {
      const res = await authApi.getProfile();
      if (res?.data?.data) {
        const customer = res.data.data;
        const userRole = customer.role || role || 'CUSTOMER';
        const updated = { ...customer, role: userRole };
        setUser(updated);
        setStorageItem('brightbuy_user', JSON.stringify(updated));
        return updated;
      }
    } catch (err) {
      console.warn('[AuthContext] refreshProfile failed:', err.message);
    }
    return null;
  };

  const value = {
    token,
    user,
    role,
    isAuthenticated: Boolean(token && role !== 'GUEST'),
    isLoading,
    login,
    register,
    logout,
    quickLogin,
    updateUser,
    refreshProfile,
    DEMO_ACCOUNTS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
