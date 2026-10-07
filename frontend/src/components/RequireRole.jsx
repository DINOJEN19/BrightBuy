import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ roles = [], children }) {
  const { role: userRole, isAuthenticated, isLoading, quickLogin } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: '12px',
        color: '#64748b',
        fontSize: '15px',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span>Verifying permissions...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If not logged in at all, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but does not have the required role
  if (roles.length > 0 && !roles.includes(userRole)) {
    const targetDemoRole = roles.includes('ADMIN') ? 'ADMIN' : (roles[0] || 'ADMIN');

    return (
      <div style={{
        maxWidth: '560px',
        margin: '60px auto',
        padding: '36px 28px',
        backgroundColor: '#ffffff',
        border: '1px solid #fee2e2',
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.08), 0 8px 10px -6px rgba(239, 68, 68, 0.05)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#fef2f2',
          border: '2px solid #fee2e2',
          color: '#ef4444',
          fontSize: '26px',
          marginBottom: '20px',
        }}>
          🛡️
        </div>
        <h3 style={{ fontSize: '20px', color: '#991b1b', marginBottom: '8px', fontWeight: '700' }}>
          Access Restricted
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          This page requires one of the following roles: <strong style={{ color: '#0f172a' }}>{roles.join(', ')}</strong>.
          <br />
          Your current session role is: <span style={{
            display: 'inline-block',
            backgroundColor: '#f1f5f9',
            color: '#334155',
            padding: '2px 8px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '12px',
          }}>{userRole}</span>.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            disabled={isSwitching}
            onClick={async () => {
              setIsSwitching(true);
              try {
                await quickLogin(targetDemoRole);
              } catch (err) {
                console.error('Failed to switch to role:', err);
              } finally {
                setIsSwitching(false);
              }
            }}
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: isSwitching ? 'not-allowed' : 'pointer',
              opacity: isSwitching ? 0.7 : 1,
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            {isSwitching ? `Switching to ${targetDemoRole}...` : `Quick Demo Switch to ${targetDemoRole}`}
          </button>
        </div>
      </div>
    );
  }

  return children;
}
