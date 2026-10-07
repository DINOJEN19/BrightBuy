import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Determine redirection destination
  const redirectPath = location.state?.from?.pathname || '/products';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const loggedUser = await login(email.trim(), password);
      // If admin, default redirect can go to /admin if they came from root/products
      if (loggedUser.role === 'ADMIN' && (!location.state?.from || location.state?.from?.pathname === '/products')) {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please verify your credentials.');
      } else {
        setError(err.message || 'Unable to connect to the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = async (roleKey) => {
    setError(null);
    setIsLoading(true);
    try {
      const loggedUser = await quickLogin(roleKey);
      if (loggedUser.role === 'ADMIN' && (!location.state?.from || location.state?.from?.pathname === '/products')) {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
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
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
              marginBottom: '16px',
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
              Welcome Back
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Sign in to manage your orders, cart, and profile
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px',
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '15px',
                }}>
                  ✉️
                </span>
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    paddingTop: '11px',
                    paddingBottom: '11px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#334155',
                }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '15px',
                }}>
                  🔒
                </span>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '40px',
                    paddingTop: '11px',
                    paddingBottom: '11px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '4px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '8px',
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
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* One-Click Quick Demo Accounts */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '12px',
            }}>
              Or Sign In Instantly With Demo Accounts
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDemoFill('CUSTOMER')}
                disabled={isLoading}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                title="Log in as Customer (David Martinez)"
              >
                <span>🛒</span>
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('ADMIN')}
                disabled={isLoading}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                title="Log in as Administrator"
              >
                <span>🛡️</span>
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('STAFF')}
                disabled={isLoading}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                title="Log in as Warehouse Staff"
              >
                <span>📦</span>
                <span>Staff</span>
              </button>
            </div>
          </div>

          {/* Footer Link to Register */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#64748b',
          }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: '#4f46e5',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
