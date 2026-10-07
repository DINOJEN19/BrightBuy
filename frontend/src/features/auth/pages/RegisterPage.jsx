import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
      });

      // Navigate to products on success
      navigate('/products');
    } catch (err) {
      const serverMsg = err.response?.data?.error?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.response?.status === 409) {
        setError('An account with this email address already exists.');
      } else {
        setError(err.message || 'Registration failed. Please check your inputs and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1), 0 0 1px 1px rgba(15, 23, 42, 0.05)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
      }}>
        {/* Top Decorative Gradient Strip */}
        <div style={{
          height: '6px',
          background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #10b981 100%)',
        }} />

        <div style={{ padding: '36px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: '800',
              marginBottom: '14px',
              boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.35)',
            }}>
              B
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}>
              Create an Account
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Join BrightBuy for fast checkout and real-time order tracking
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '20px',
              color: '#991b1b',
              fontSize: '13px',
              lineHeight: '1.4',
            }}>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
              <div style={{ flex: 1 }}>{error}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="register-fullname-input"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. David Martinez"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="register-email-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Passwords (2 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="register-password-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 chars"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                  Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="register-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Show Password Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                id="show-password-check"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="show-password-check" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                Show password text
              </label>
            </div>

            {/* Optional Delivery Information Section */}
            <div style={{
              marginTop: '4px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}>
              <p style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#475569',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                Delivery Details (Optional, for quicker checkout)
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  id="register-phone-input"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number (e.g. 5125550101)"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <input
                    id="register-address-input"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street Address"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                    }}
                  />
                  <input
                    id="register-city-input"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              id="register-submit-button"
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                fontSize: '15px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer Link to Login */}
          <div style={{
            marginTop: '22px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#64748b',
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#4f46e5',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
