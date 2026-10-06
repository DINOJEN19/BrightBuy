// frontend/src/features/admin/pages/reports/DeliveryEstimatesReportPage.jsx
// Delivery Time Estimates view for upcoming undelivered orders (REQ-9.4).
// Owned by Person 5.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDeliveryEstimates } from '../../api';

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const badgeStyle = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'DISPATCHED') {
    return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
  }
  if (s === 'PENDING') {
    return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
  }
  return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
};

const formatDate = (val) => {
  if (!val) return 'N/A';
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
};

const DeliveryEstimatesReportPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDeliveryEstimates();
      setData(res.data?.data || []);
    } catch (err) {
      const errMsg = err?.message || err?.response?.data?.error?.message;
      setError(errMsg || 'Failed to load delivery estimates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredData = data.filter((item) => {
    const matchesCity = !searchTerm || (item.destinationCity || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (item.deliveryStatus || '').toUpperCase() === statusFilter;
    return matchesCity && matchesStatus;
  });

  const pendingCount = data.filter((item) => (item.deliveryStatus || '').toUpperCase() === 'PENDING').length;
  const dispatchedCount = data.filter((item) => (item.deliveryStatus || '').toUpperCase() === 'DISPATCHED').length;

  return (
    <div style={{ maxWidth: '1000px', margin: '36px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
          Delivery Time Estimates
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Estimated delivery dates for upcoming and undelivered customer orders (REQ-9.4).
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
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total In-Transit</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {data.length}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Dispatched</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {dispatchedCount}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Pending Preparation</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
            {pendingCount}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '14px',
          padding: '16px 20px',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search by destination city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DISPATCHED">Dispatched Only</option>
            <option value="PENDING">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Estimates Table */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          Upcoming Deliveries
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', margin: '20px 0' }}>Loading deliveries...</p>
        ) : filteredData.length === 0 ? (
          <p style={{ color: '#64748b', margin: '12px 0' }}>No pending deliveries match your filter.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', width: '120px' }}>Order ID</th>
                  <th style={{ padding: '12px 16px' }}>Destination City</th>
                  <th style={{ padding: '12px 16px' }}>Estimated Delivery Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => (
                  <tr
                    key={item.orderId || idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#2563eb' }}>
                      #{item.orderId}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                      {item.destinationCity}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      {formatDate(item.estimatedDeliveryDate)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          ...badgeStyle(item.deliveryStatus),
                        }}
                      >
                        {item.deliveryStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryEstimatesReportPage;
