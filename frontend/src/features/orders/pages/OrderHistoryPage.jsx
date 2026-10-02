// frontend/src/features/orders/pages/OrderHistoryPage.jsx
// Customer's own orders (paginated). Calls GET /orders.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../api';
import OrderStatusBadge from '../components/OrderStatusBadge';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const cell = { padding: '14px 16px', fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' };
const head = { ...cell, fontSize: '13px', fontWeight: '600', color: '#64748b', backgroundColor: '#f8fafc', textAlign: 'left' };

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async (pageToLoad) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrders({ page: pageToLoad, pageSize: 20 });
      setOrders(response.data?.data || []);
      setMeta(response.data?.meta || { page: pageToLoad, pageSize: 20, total: 0 });
    } catch (err) {
      setError(err?.message || 'Failed to load your orders. Please make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>Loading your orders...</p>
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
            onClick={() => fetchOrders(page)}
            style={{ padding: '8px 16px', backgroundColor: '#b91c1c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize));

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px', color: '#0f172a' }}>
        Your Orders{' '}
        {meta.total > 0 && (
          <span style={{ fontSize: '18px', color: '#64748b', fontWeight: 'normal' }}>({meta.total})</span>
        )}
      </h1>

      {orders.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No orders yet</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Once you place an order, it will show up here.</p>
          <Link
            to="/products"
            style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#2563eb', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: '600' }}
          >
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto', backgroundColor: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={head}>Order</th>
                  <th style={head}>Date</th>
                  <th style={head}>Status</th>
                  <th style={head}>Delivery</th>
                  <th style={head}>Payment</th>
                  <th style={{ ...head, textAlign: 'right' }}>Total</th>
                  <th style={head}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td style={{ ...cell, fontWeight: '600' }}>#{o.orderId}</td>
                    <td style={cell}>{formatDate(o.orderDate)}</td>
                    <td style={cell}><OrderStatusBadge status={o.orderStatus} /></td>
                    <td style={cell}>
                      {o.deliveryMode === 'STORE_PICKUP' ? 'Store Pickup' : o.deliveryMode === 'STANDARD_DELIVERY' ? 'Standard Delivery' : 'N/A'}
                    </td>
                    <td style={cell}><OrderStatusBadge status={o.paymentStatus} /></td>
                    <td style={{ ...cell, textAlign: 'right', fontWeight: '700' }}>${Number(o.totalAmount).toFixed(2)}</td>
                    <td style={cell}>
                      <Link to={`/orders/${o.orderId}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 14px' }}>
              Previous
            </button>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              Page {meta.page} of {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 14px' }}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderHistoryPage;
