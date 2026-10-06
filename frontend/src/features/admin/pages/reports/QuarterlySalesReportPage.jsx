// frontend/src/features/admin/pages/reports/QuarterlySalesReportPage.jsx
// Quarterly Sales Report view (REQ-9.1).
// Owned by Person 5.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuarterlySales } from '../../api';
import ReportChart from '../../components/ReportChart';

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const QuarterlySalesReportPage = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async (targetYear) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getQuarterlySales({ year: targetYear });
      setData(res.data?.data || []);
    } catch (err) {
      const errMsg = err?.message || err?.response?.data?.error?.message;
      setError(errMsg || 'Failed to load quarterly sales report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(year);
  }, [year]);

  // Aggregate metrics
  const totalSales = data.reduce((sum, item) => sum + (Number(item.totalSales) || 0), 0);
  const totalOrders = data.reduce((sum, item) => sum + (Number(item.orderCount) || 0), 0);

  const chartData = data.map((item) => ({
    label: item.quarter,
    value: item.totalSales,
  }));

  return (
    <div style={{ maxWidth: '1000px', margin: '36px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link to="/admin" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Admin Dashboard
          </Link>
          <h1 style={{ margin: '8px 0 4px 0', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
            Quarterly Sales Report
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Quarter-wise sales performance and transaction volumes (REQ-9.1).
          </p>
        </div>

        {/* Year filter control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="year-select" style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
            Year:
          </label>
          <select
            id="year-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '24px', color: '#b91c1c', fontSize: '14px' }}>
          <strong>Error loading report:</strong> {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Annual Sales</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Total Orders</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {totalOrders.toLocaleString()}
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Average Quarter Sales</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            ${(data.length ? totalSales / data.length : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Reusable Chart */}
      <ReportChart
        title={`Sales by Quarter (${year})`}
        subtitle="Revenue generated across quarters"
        data={chartData}
        valuePrefix="$"
        type="column"
        emptyMessage={`No sales recorded for the year ${year}.`}
      />

      {/* Detailed Data Table */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          Breakdown Table
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', margin: '20px 0' }}>Loading report data...</p>
        ) : data.length === 0 ? (
          <p style={{ color: '#64748b', margin: '12px 0' }}>No records found for {year}.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Quarter</th>
                  <th style={{ padding: '12px 16px' }}>Order Count</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Sales</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => {
                  const orders = item.orderCount || 0;
                  const sales = Number(item.totalSales) || 0;
                  const aov = orders > 0 ? sales / orders : 0;
                  return (
                    <tr
                      key={item.quarter || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                        {item.quarter}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        {orders.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                        ${sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b' }}>
                        ${aov.toFixed(2)}
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

export default QuarterlySalesReportPage;
