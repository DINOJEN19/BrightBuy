import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Link } from 'react-router-dom';
import { catalogueRoutes } from './features/catalogue/routes';
import { cartRoutes } from './features/cart/routes';
import { ordersRoutes } from './features/orders/routes';
import { adminRoutes } from './features/admin/routes';
import { ensureToken } from './api/client';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('brightbuy_role') || 'CUSTOMER');
  const [userName, setUserName] = useState('David Martinez');

  // Initialize customer auth token immediately on startup
  useEffect(() => {
    ensureToken().then(() => {
      setRole(localStorage.getItem('brightbuy_role') || 'CUSTOMER');
    });

    const handleAuthChange = () => {
      setRole(localStorage.getItem('brightbuy_role') || 'CUSTOMER');
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const toggleRole = () => {
    const newRole = role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    localStorage.setItem('brightbuy_role', newRole);
    setRole(newRole);
    // Reload if needed by route guards
    window.dispatchEvent(new Event('auth-change'));
  };

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? '#ffffff' : '#94a3b8',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  });

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modern Navigation Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderBottom: '1px solid #1e293b',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/products" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}>
                  B
                </span>
                <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                  Bright<span style={{ color: '#38bdf8' }}>Buy</span>
                </span>
              </Link>
            </div>

            {/* Navigation Tabs */}
            <nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <NavLink to="/products" style={navLinkStyle}>Products</NavLink>
              <NavLink to="/categories" style={navLinkStyle}>Categories</NavLink>
              <NavLink to="/cart" style={navLinkStyle}>Cart</NavLink>
              <NavLink to="/orders" style={navLinkStyle}>Orders</NavLink>
              <NavLink to="/admin" style={navLinkStyle}>Admin</NavLink>
            </nav>

            {/* User Session & Role Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1e293b',
                padding: '5px 12px',
                borderRadius: '9999px',
                border: '1px solid #334155',
                fontSize: '13px',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }} />
                <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{userName}</span>
                <span style={{
                  backgroundColor: role === 'ADMIN' ? '#7c3aed' : '#2563eb',
                  color: '#ffffff',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}>
                  {role}
                </span>
              </div>

              <button
                onClick={toggleRole}
                title="Toggle between Customer and Admin role permissions"
                style={{
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Switch to {role === 'ADMIN' ? 'Customer' : 'Admin'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            {catalogueRoutes}
            {cartRoutes}
            {ordersRoutes}
            {adminRoutes}
            <Route path="*" element={
              <div style={{
                padding: '80px 20px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                margin: '40px auto',
                maxWidth: '500px',
              }}>
                <h2 style={{ fontSize: '22px', color: '#0f172a', marginBottom: '8px' }}>Page Not Found</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>The route you are looking for does not exist.</p>
                <Link to="/products" style={{
                  display: 'inline-block',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}>
                  Back to Products
                </Link>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
