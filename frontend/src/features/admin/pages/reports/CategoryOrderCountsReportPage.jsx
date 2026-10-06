// frontend/src/features/admin/pages/reports/CategoryOrderCountsReportPage.jsx
// Category-wise Order Count view (REQ-9.3).
// Owned by Person 5.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategoryOrderCounts } from '../../api';
import ReportChart from '../../components/ReportChart';

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const CategoryOrderCountsReportPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategoryOrderCounts();
      setData(res.data?.data || []);
    } catch (err) {
      const errMsg = err?.message || err?.response?.data?.error?.message;
      setError(errMsg || 'Failed to load category order counts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const totalOrders = data.reduce((sum, item) => sum + (Number(item.orderCount) || 0), 0);

  const chartData = data.map((item) => ({
    label: item.categoryName,
    value: item.orderCount,
  }));

  return (
    <div style={{ maxWidth: '1000px', margin: '36px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
          Category-wise Order Counts
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Total volume of orders spanning each product category (REQ-9.3).
        </p>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '24px', color: '#b91c1c', fontSize: '14px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Active Categories</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {data.length}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Category Orders</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {totalOrders.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Reusable Chart */}
      <ReportChart
        title="Orders by Category"
        subtitle="Distribution of orders placed across categories"
        data={chartData}
        valueSuffix=" orders"
        type="column"
        emptyMessage="No category orders found."
      />

      {/* Data Table */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          Category Order Breakdown
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', margin: '20px 0' }}>Loading categories...</p>
        ) : data.length === 0 ? (
          <p style={{ color: '#64748b', margin: '12px 0' }}>No categories found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', width: '120px' }}>Category ID</th>
                  <th style={{ padding: '12px 16px' }}>Category Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Orders</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Share of Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => {
                  const count = Number(item.orderCount) || 0;
                  const share = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                  return (
                    <tr
                      key={item.categoryId || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: '600' }}>
                        #{item.categoryId}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                        {item.categoryName}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>
                        {count.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b' }}>
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryOrderCountsReportPage;
