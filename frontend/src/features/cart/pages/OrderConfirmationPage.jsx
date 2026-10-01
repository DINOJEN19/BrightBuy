// frontend/src/features/cart/pages/OrderConfirmationPage.jsx
// Displays confirmed order summary, order ID, and estimated delivery date.
// Owned by Person 3.

import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const OrderConfirmationPage = () => {
  const location = useLocation();
  const state = location.state || {};

  const {
    orderId,
    estimatedDeliveryDate,
    orderStatus = 'CONFIRMED',
    destinationCity,
    deliveryMode,
    paymentMethod,
    total,
  } = state;

  return (
    <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto 24px auto',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
          Thank You! Your Order is Confirmed
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 32px 0' }}>
          We have received your order and our fulfillment team has begun processing it.
        </p>

        {/* Highlighted Order & Delivery Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px', textAlign: 'left' }}>
          {/* Order ID Card */}
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Order Reference
            </span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
              {orderId ? `#${orderId}` : 'CONFIRMED'}
            </div>
            <div style={{ marginTop: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                }}
              >
                {orderStatus}
              </span>
            </div>
          </div>

          {/* Delivery Date Card */}
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Estimated Delivery Date
            </span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
              {estimatedDeliveryDate ? String(estimatedDeliveryDate) : '5-7 Business Days'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
              Calculated via BrightBuy logistics engine
            </div>
          </div>
        </div>

        {/* Detailed Order Metadata */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            padding: '20px 0',
            marginBottom: '32px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {destinationCity && (
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Destination</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{destinationCity}</span>
              </div>
            )}
            {deliveryMode && (
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Fulfillment</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {deliveryMode === 'STORE_PICKUP' ? 'Store Pickup' : 'Standard Delivery'}
                </span>
              </div>
            )}
            {paymentMethod && (
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Payment Method</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {paymentMethod === 'CARD_PAYMENT' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                </span>
              </div>
            )}
            {total !== undefined && total !== null && (
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Total Paid/Due</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>${Number(total).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link
            to="/products"
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
            }}
          >
            Continue Shopping
          </Link>
          <Link
            to="/orders"
            style={{
              padding: '12px 24px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              border: '1px solid #cbd5e1',
            }}
          >
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
