import React, { useEffect, useState } from 'react';

export default function RequireRole({ roles = [], children }) {
  const [userRole, setUserRole] = useState(localStorage.getItem('brightbuy_role') || 'ADMIN');

  useEffect(() => {
    const handleAuthChange = () => {
      setUserRole(localStorage.getItem('brightbuy_role') || 'ADMIN');
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  if (roles.length > 0 && !roles.includes(userRole)) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '60px auto',
        padding: '32px 24px',
        backgroundColor: '#ffffff',
        border: '1px solid #fee2e2',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          color: '#ef4444',
          fontSize: '22px',
          marginBottom: '16px',
        }}>
          ⚠️
        </div>
        <h3 style={{ fontSize: '18px', color: '#991b1b', marginBottom: '8px' }}>Access Restricted</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          This page requires one of the following roles: <strong>{roles.join(', ')}</strong>.
          <br />Your current role is: <strong>{userRole}</strong>.
        </p>
        <button
          onClick={() => {
            localStorage.setItem('brightbuy_role', 'ADMIN');
            window.dispatchEvent(new Event('auth-change'));
          }}
          style={{
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Switch to Admin Role
        </button>
      </div>
    );
  }

  return children;
}
