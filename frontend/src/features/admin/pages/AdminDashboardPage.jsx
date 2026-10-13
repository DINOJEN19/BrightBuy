// frontend/src/features/admin/pages/AdminDashboardPage.jsx
// Landing page for ADMIN role, links to the 5 report views and catalogue admin.
// Owned by Person 5.

import React from 'react';
import { Link } from 'react-router-dom';

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  textDecoration: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const reports = [
  {
    title: 'Quarterly Sales Report',
    path: '/admin/reports/quarterly-sales',
    badge: 'Sales & Revenue',
    badgeColor: '#dbeafe',
    textColor: '#1e40af',
  },
  {
    title: 'Top-Selling Products',
    path: '/admin/reports/top-selling-products',
    badge: 'Leaderboard',
    badgeColor: '#dcfce7',
    textColor: '#166534',
  },
  {
    title: 'Category-wise Order Counts',
    path: '/admin/reports/category-order-counts',
    badge: 'Distribution',
    badgeColor: '#f3e8ff',
    textColor: '#6b21a8',
  },
  {
    title: 'Delivery Time Estimates',
    path: '/admin/reports/delivery-estimates',
    badge: 'Logistics',
    badgeColor: '#fef3c7',
    textColor: '#92400e',
  },
  {
    title: 'Customer Order Summary',
    path: '/admin/reports/customer-summary',
    badge: 'Accounts',
    badgeColor: '#e0e7ff',
    textColor: '#3730a3',
  },
];

const catalogueActions = [
  {
    title: 'Add New Product',
    path: '/admin/products/new',
    badge: 'Catalogue Master',
    badgeColor: '#ccfbf1',
    textColor: '#115e59',
  },
  {
    title: 'Add New Category',
    path: '/admin/categories/new',
    badge: 'Taxonomy',
    badgeColor: '#ffedd5',
    textColor: '#9a3412',
  },
];

const AdminDashboardPage = () => {
  return (
    <div style={{ maxWidth: '1050px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '16px', fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>
          ADMINISTRATION PORTAL
        </div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>
          Management Reporting & Catalogue Admin
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
          Access executive analytics, logistics estimates, customer summaries, and catalogue management tools.
        </p>
      </div>

      {/* Catalogue Actions Section */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
            Catalogue Administration
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Manage products, variants & categories</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {catalogueActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              style={{
                ...cardStyle,
                borderLeft: '4px solid #2563eb',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: action.badgeColor,
                      color: action.textColor,
                    }}
                  >
                    {action.badge}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                  {action.title}
                </h3>
              </div>
              <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>
                Open form →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Reports Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
            Mandated Management Reports
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>5 executive reporting views</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {reports.map((report) => (
            <Link
              key={report.path}
              to={report.path}
              style={cardStyle}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: report.badgeColor,
                      color: report.textColor,
                    }}
                  >
                    {report.badge}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                  {report.title}
                </h3>
              </div>
              <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>
                View report →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
