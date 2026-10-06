// frontend/src/features/admin/pages/reports/TopSellingProductsReportPage.jsx
// Top-Selling Products Report view (REQ-9.2).
// Owned by Person 5.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTopSellingProducts } from '../../api';
import ReportChart from '../../components/ReportChart';

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const inputStyle = {
  padding: '8px 12px',
  fontSize: '14px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontFamily: 'inherit',
};

const TopSellingProductsReportPage = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState('10');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (limit) params.limit = limit;

      const res = await getTopSellingProducts(params);
      setData(res.data?.data || []);
    } catch (err) {
      const errMsg = err?.message || err?.response?.data?.error?.message;
      setError(errMsg || 'Failed to load top-selling products report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const totalRevenue = data.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
  const totalUnits = data.reduce((sum, item) => sum + (Number(item.unitsSold) || 0), 0);

  const chartData = data.map((item) => ({
    label: item.productName || `Product #${item.productId}`,
    value: item.revenue,
  }));

  return (
    <div style={{ maxWidth: '1000px', margin: '36px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
          Top-Selling Products Report
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Catalogue leaders ranked by volume sold and revenue generated (REQ-9.2).
        </p>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        style={{
          ...cardStyle,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: '16px',
          padding: '16px 20px',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
            From Date
          </label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
            To Date
          </label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
            Limit
          </label>
          <select value={limit} onChange={(e) => setLimit(e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }}>
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="25">Top 25</option>
            <option value="50">Top 50</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            padding: '9px 18px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Apply Filters
        </button>
      </form>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '24px', color: '#b91c1c', fontSize: '14px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Combined Top Revenue</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Combined Units Sold</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {totalUnits.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart for Product Revenue */}
      <ReportChart
        title="Top Selling Products by Revenue"
        subtitle="Revenue performance comparison"
        data={chartData}
        valuePrefix="$"
        type="horizontal"
        emptyMessage="No product sales found for this period."
      />

      {/* Table */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          Leaderboard Table
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', margin: '20px 0' }}>Loading products...</p>
        ) : data.length === 0 ? (
          <p style={{ color: '#64748b', margin: '12px 0' }}>No products found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', width: '60px' }}>Rank</th>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Units Sold</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr
                    key={item.productId || idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: idx < 3 ? '#2563eb' : '#64748b' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.productName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Product ID: {item.productId}</div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                      {Number(item.unitsSold).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                      ${Number(item.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default TopSellingProductsReportPage;
