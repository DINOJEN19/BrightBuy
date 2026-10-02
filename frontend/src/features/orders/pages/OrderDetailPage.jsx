// frontend/src/features/orders/pages/OrderDetailPage.jsx
// Line items + delivery + payment for one order. Calls GET /orders/:orderId.
// The backend detail response is { orderId, items, delivery, payment } (no orderStatus / total),
// so the total shown here is the sum of the line-item subtotals.

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import DeliveryTracker from '../components/DeliveryTracker';

const card = { padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', marginBottom: '24px' };
const cardTitle = { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' };

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrder(orderId);
      setOrder(response.data?.data || null);
    } catch (err) {
      if (err?.code === 'FORBIDDEN') setError('This order does not belong to your account.');
      else if (err?.code === 'NOT_FOUND') setError('Order not found.');
      else setError(err?.message || 'Failed to load this order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', color: '#b91c1c' }}>
          <p style={{ margin: 0, fontWeight: '600' }}>Error</p>
          <p style={{ margin: '4px 0 12px 0' }}>{error || 'Order not found.'}</p>
          <Link to="/orders" style={{ color: '#b91c1c', fontWeight: '600' }}>Back to your orders</Link>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const itemsTotal = items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
  const payment = order.payment;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Link to="/orders" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
        &larr; Back to your orders
      </Link>
      <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '8px 0 24px 0', color: '#0f172a' }}>
        Order #{order.orderId}
      </h1>

      {/* Items */}
      <div style={card}>
        <h3 style={cardTitle}>Items</h3>
        {items.length === 0 ? (
          <p style={{ color: '#64748b', margin: 0 }}>No items found for this order.</p>
        ) : (
          <>
            {items.map((it, index) => (
              <div
                key={`${it.variantId}-${index}`}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}
              >
                <div>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>{it.variantName}</span>
                  <span style={{ color: '#64748b' }}> x {it.quantity}</span>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Unit price: ${Number(it.unitPrice).toFixed(2)}</div>
                </div>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>${Number(it.subtotal).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Total</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb' }}>${itemsTotal.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Delivery */}
      <div style={card}>
        <h3 style={cardTitle}>Delivery</h3>
        <DeliveryTracker delivery={order.delivery} />
      </div>

      {/* Payment */}
      <div style={card}>
        <h3 style={cardTitle}>Payment</h3>
        {payment ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Method</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                {payment.paymentMethod === 'CARD_PAYMENT' ? 'Credit/Debit Card' : payment.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : payment.paymentMethod}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Status</span>
              <OrderStatusBadge status={payment.paymentStatus} />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Amount</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>${Number(payment.amount).toFixed(2)}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Payment date</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{formatDate(payment.paymentDate)}</span>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748b', margin: 0 }}>No payment information for this order.</p>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
