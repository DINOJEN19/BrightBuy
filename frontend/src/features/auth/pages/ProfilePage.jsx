import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import * as authApi from '../api';

export default function ProfilePage() {
  const { user, role, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    customerId: user?.customerId || null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await authApi.getProfile();
        if (isMounted && res.data?.data) {
          const data = res.data.data;
          setProfile(data);
          setFormData(data);
          updateUser(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error?.message || 'Failed to fetch profile.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [updateUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const res = await authApi.updateProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
      });

      const updated = res.data?.data || formData;
      setProfile(updated);
      updateUser(updated);
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
        <span>Loading customer profile...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = (profile.fullName || user?.fullName || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 16px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
            Account Profile
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Manage your personal information and default delivery settings
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fee2e2',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Notification Banners */}
      {message && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* User Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '28px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            paddingBottom: '24px',
            borderBottom: '1px solid #f1f5f9',
            marginBottom: '24px',
          }}>
            {/* Avatar */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.3)',
            }}>
              {initials}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {profile.fullName || 'Customer'}
                </h2>
                <span style={{
                  backgroundColor: role === 'ADMIN' ? '#7c3aed' : (role === 'WAREHOUSE_STAFF' ? '#0891b2' : '#2563eb'),
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}>
                  {role}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                {profile.email} • Customer #{profile.customerId || user?.customerId}
              </p>
            </div>

            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
                  }}
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => {
                    setFormData({ ...profile });
                    setIsEditing(false);
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Profile Details or Edit Form */}
          {!isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Full Name
                </label>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                  {profile.fullName || '—'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Email Address
                </label>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                  {profile.email || '—'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Phone Number
                </label>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                  {profile.phone || <span style={{ color: '#94a3b8' }}>Not set</span>}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
                  City
                </label>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                  {profile.city || <span style={{ color: '#94a3b8' }}>Not set</span>}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Delivery Address
                </label>
                <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                  {profile.address || <span style={{ color: '#94a3b8' }}>Not set</span>}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 5125550101"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Austin"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                    Email (Read-Only)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. 1204 Congress Ave"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Quick Links Section */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
            Quick Actions
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <Link
              to="/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#1e293b',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '20px' }}>📦</span>
              <div>
                <div>My Order History</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>Track packages & receipts</div>
              </div>
            </Link>

            <Link
              to="/cart"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#1e293b',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '20px' }}>🛒</span>
              <div>
                <div>Shopping Cart</div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>Review active cart items</div>
              </div>
            </Link>

            {role === 'ADMIN' && (
              <Link
                to="/admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #ede9fe',
                  backgroundColor: '#f5f3ff',
                  color: '#6d28d9',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <div>
                  <div>Admin Dashboard</div>
                  <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '400' }}>Manage store & view reports</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
