// frontend/src/features/admin/pages/reports/CustomerSummaryReportPage.jsx
// Customer-wise Order Summary with payment status (REQ-9.5).
// Owned by Person 5.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCustomerSummary } from '../../api';

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const paymentBadge = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'PAID') {
    return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
  }
  if (s === 'FAILED') {
    return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
  }
  return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
};

const CustomerSummaryReportPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomerSummary();
      setData(res.data?.data || []);
    } catch (err) {
      const errMsg = err?.message || err?.response?.data?.error?.message;
      setError(errMsg || 'Failed to load customer summary report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredData = data.filter((cust) =>
    !searchTerm || (cust.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCustomers = data.length;
  const totalOrdersPlaced = data.reduce((sum, c) => sum + (c.orders?.length || 0), 0);
  const totalSpentAcrossAll = data.reduce(
    (sum, c) => sum + (c.orders || []).reduce((sub, o) => sub + (Number(o.totalAmount) || 0), 0),
    0
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '36px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
          Customer Order Summary
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Customer-wise order totals, transaction history, and payment statuses (REQ-9.5).
        </p>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '24px', color: '#b91c1c', fontSize: '14px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Active Customers</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {totalCustomers}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Orders Placed</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {totalOrdersPlaced}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Cumulative Spent</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            ${totalSpentAcrossAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Filter by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Customer Accordion / Cards List */}
      <div>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', margin: '30px 0' }}>Loading customer summaries...</p>
        ) : filteredData.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', margin: '30px 0' }}>No customer records found.</p>
        ) : (
          filteredData.map((customer) => {
            const orders = customer.orders || [];
            const custTotal = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

            return (
              <div key={customer.customerId} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                      {customer.fullName}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Customer ID: #{customer.customerId}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                      Total: ${custTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '8px 0' }}>No orders placed yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 12px' }}>Order ID</th>
                          <th style={{ padding: '8px 12px' }}>Amount</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.orderId} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '10px 12px', fontWeight: '600', color: '#2563eb' }}>
                              #{o.orderId}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: '700', color: '#334155' }}>
                              ${Number(o.totalAmount).toFixed(2)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  ...paymentBadge(o.paymentStatus),
                                }}
                              >
                                {o.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CustomerSummaryReportPage;
