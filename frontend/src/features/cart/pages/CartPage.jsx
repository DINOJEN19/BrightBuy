// frontend/src/features/cart/pages/CartPage.jsx
// Displays active cart line items, quantity edit, item removal, and subtotal.
// Owned by Person 3.

import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateItem, removeItem } from '../api';
import { useAuth } from '../../../context/AuthContext';

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState({ cartId: null, items: [], total: 0 });
  const [error, setError] = useState(null);
  const [busyItemIds, setBusyItemIds] = useState([]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await getCart();
      setCart(response.data?.data || { cartId: null, items: [], total: 0 });
    } catch (err) {
      setError(err?.message || 'Failed to load shopping cart.');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    if (isAuthenticated) {
      getCart()
        .then((res) => {
          if (active) setCart(res.data?.data || { cartId: null, items: [], total: 0 });
        })
        .catch((err) => {
          if (active) setError(err?.message || 'Failed to load shopping cart.');
        });
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleQuantityChange = async (cartItemId, newQty) => {
    if (newQty <= 0) return;
    setBusyItemIds((prev) => [...prev, cartItemId]);
    try {
      await updateItem(cartItemId, { quantity: newQty });
      // Refresh cart
      const response = await getCart();
      setCart(response.data?.data || { cartId: null, items: [], total: 0 });
    } catch (err) {
      alert(err?.message || 'Failed to update quantity.');
    } finally {
      setBusyItemIds((prev) => prev.filter((id) => id !== cartItemId));
    }
  };

  const handleRemove = async (cartItemId) => {
    setBusyItemIds((prev) => [...prev, cartItemId]);
    try {
      await removeItem(cartItemId);
      // Refresh cart
      const response = await getCart();
      setCart(response.data?.data || { cartId: null, items: [], total: 0 });
    } catch (err) {
      alert(err?.message || 'Failed to remove item.');
    } finally {
      setBusyItemIds((prev) => prev.filter((id) => id !== cartItemId));
    }
  };

  if (authLoading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>Loading your shopping cart...</p>
      </div>
    );
  }

  // Guest view: prompt guest to log in or register to check out
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '720px', margin: '48px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '48px 32px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)',
            color: '#4f46e5',
            fontSize: '32px',
            marginBottom: '20px',
          }}>
            🛒
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
            Shopping Cart & Checkout
          </h2>

          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto 28px auto' }}>
            You are browsing BrightBuy as a <strong>Guest</strong>.
            <br />
            Only registered customers can manage their cart, proceed to checkout, and place orders.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link
              to="/login"
              state={{ from: { pathname: '/checkout' } }}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In to Checkout
            </Link>

            <Link
              to="/register"
              style={{
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Register New Account
            </Link>
          </div>

          <div>
            <Link
              to="/products"
              style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}
            >
              &larr; Continue Browsing Catalogue as Guest
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', color: '#b91c1c' }}>
          <p style={{ margin: 0, fontWeight: '600' }}>Error</p>
          <p style={{ margin: '4px 0 12px 0' }}>{error}</p>
          <button
            onClick={refreshCart}
            style={{ padding: '8px 16px', backgroundColor: '#b91c1c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px', color: '#0f172a' }}>
        Your Shopping Cart {items.length > 0 && <span style={{ fontSize: '18px', color: '#64748b', fontWeight: 'normal' }}>({items.length} {items.length === 1 ? 'item' : 'items'})</span>}
      </h1>

      {isEmpty ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '16px', color: '#94a3b8', fontWeight: 'bold' }}>[ Cart Empty ]</div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
            Your cart is currently empty
          </h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link
            to="/products"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'background-color 0.2s',
            }}
          >
            Explore Product Catalogue
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Left Column: Cart Items List */}
          <div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
              {items.map((item, index) => {
                const isBusy = busyItemIds.includes(item.cartItemId);
                return (
                  <div
                    key={item.cartItemId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px',
                      borderBottom: index < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                      opacity: isBusy ? 0.6 : 1,
                      pointerEvents: isBusy ? 'none' : 'auto',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {item.variantName}
                      </h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                        Unit Price: <span style={{ fontWeight: '500', color: '#0f172a' }}>${item.unitPrice.toFixed(2)}</span>
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 24px' }}>
                      <button
                        onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isBusy}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '600' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                        disabled={isBusy}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Line Subtotal */}
                    <div style={{ minWidth: '100px', textAlign: 'right', marginRight: '16px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        ${item.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Delete Item */}
                    <div>
                      <button
                        onClick={() => handleRemove(item.cartItemId)}
                        disabled={isBusy}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                        }}
                        title="Remove item"
                      >
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '16px' }}>
              <Link to="/products" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                &larr; Continue Browsing Products
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div>
            <div
              style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
                <span>Subtotal ({items.length} items)</span>
                <span style={{ fontWeight: '500', color: '#0f172a' }}>${cart.total.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
                <span>Delivery</span>
                <span style={{ color: '#10b981', fontWeight: '500' }}>Calculated at checkout</span>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Total</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb' }}>
                  ${cart.total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                Proceed to Checkout &rarr;
              </button>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                [Secure] Safe and secure encrypted checkout
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
