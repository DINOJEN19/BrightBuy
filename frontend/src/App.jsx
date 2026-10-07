import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authRoutes } from './features/auth/routes';
import { catalogueRoutes } from './features/catalogue/routes';
import { cartRoutes } from './features/cart/routes';
import { ordersRoutes } from './features/orders/routes';
import { adminRoutes } from './features/admin/routes';

function NavigationHeader() {
  const { user, role, isAuthenticated, logout, quickLogin } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        {/* Brand Logo */}
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

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <NavLink to="/products" style={navLinkStyle}>Products</NavLink>
          <NavLink to="/categories" style={navLinkStyle}>Categories</NavLink>
          <NavLink to="/cart" style={navLinkStyle}>Cart</NavLink>
          <NavLink to="/orders" style={navLinkStyle}>Orders</NavLink>
          {(role === 'ADMIN' || !isAuthenticated) && (
            <NavLink to="/admin" style={navLinkStyle}>Admin</NavLink>
          )}
        </nav>

        {/* Auth & Session Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAuthenticated ? (
            <>
              {/* Profile Chip */}
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#1e293b',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: '1px solid #334155',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.15s ease',
                }}
                title="View Account Profile"
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }} />
                <span style={{ color: '#e2e8f0', fontWeight: '500' }}>
                  {user?.fullName || 'User'}
                </span>
                <span style={{
                  backgroundColor: role === 'ADMIN' ? '#7c3aed' : (role === 'WAREHOUSE_STAFF' ? '#0891b2' : '#2563eb'),
                  color: '#ffffff',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}>
                  {role}
                </span>
              </Link>

              {/* Fast Switch Role (for testing / demo evaluation) */}
              <button
                onClick={async () => {
                  const nextRole = role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
                  await quickLogin(nextRole);
                }}
                title="Quickly switch between Customer and Admin demo sessions"
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

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              {/* Quick Demo Dropdown button */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>⚡ Demo Accounts</span>
                  <span style={{ fontSize: '10px' }}>▼</span>
                </button>

                {showDemoMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '6px',
                    width: '180px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '6px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                    zIndex: 100,
                  }}>
                    <button
                      onClick={async () => {
                        setShowDemoMenu(false);
                        await quickLogin('CUSTOMER');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>🛒</span> Customer
                    </button>
                    <button
                      onClick={async () => {
                        setShowDemoMenu(false);
                        await quickLogin('ADMIN');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>🛡️</span> Admin
                    </button>
                    <button
                      onClick={async () => {
                        setShowDemoMenu(false);
                        await quickLogin('STAFF');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>📦</span> Warehouse Staff
                    </button>
                  </div>
                )}
              </div>

              {/* Login Button */}
              <Link
                to="/login"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </Link>

              {/* Register Button */}
              <Link
                to="/register"
                style={{
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavigationHeader />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          {authRoutes}
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
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
