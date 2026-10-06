// frontend/src/features/admin/routes.jsx
// Exports Person 5's route fragment.
// Owned by Person 5.

import React from 'react';
import { Route } from 'react-router-dom';
import RequireRole from '../../components/RequireRole';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import CategoryFormPage from './pages/admin/CategoryFormPage';
import QuarterlySalesReportPage from './pages/reports/QuarterlySalesReportPage';
import TopSellingProductsReportPage from './pages/reports/TopSellingProductsReportPage';
import CategoryOrderCountsReportPage from './pages/reports/CategoryOrderCountsReportPage';
import DeliveryEstimatesReportPage from './pages/reports/DeliveryEstimatesReportPage';
import CustomerSummaryReportPage from './pages/reports/CustomerSummaryReportPage';

export const adminRoutes = [
  <Route
    key="admin-dashboard"
    path="/admin"
    element={
      <RequireRole roles={['ADMIN']}>
        <AdminDashboardPage />
      </RequireRole>
    }
  />,
  <Route
    key="admin-product-create"
    path="/admin/products/new"
    element={
      <RequireRole roles={['ADMIN']}>
        <ProductFormPage />
      </RequireRole>
    }
  />,
  <Route
    key="admin-category-create"
    path="/admin/categories/new"
    element={
      <RequireRole roles={['ADMIN']}>
        <CategoryFormPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-quarterly-sales"
    path="/admin/reports/quarterly-sales"
    element={
      <RequireRole roles={['ADMIN']}>
        <QuarterlySalesReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-quarterly-sales-direct"
    path="/reports/quarterly-sales"
    element={
      <RequireRole roles={['ADMIN']}>
        <QuarterlySalesReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-top-selling"
    path="/admin/reports/top-selling-products"
    element={
      <RequireRole roles={['ADMIN']}>
        <TopSellingProductsReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-top-selling-direct"
    path="/reports/top-selling-products"
    element={
      <RequireRole roles={['ADMIN']}>
        <TopSellingProductsReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-category-counts"
    path="/admin/reports/category-order-counts"
    element={
      <RequireRole roles={['ADMIN']}>
        <CategoryOrderCountsReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-category-counts-direct"
    path="/reports/category-order-counts"
    element={
      <RequireRole roles={['ADMIN']}>
        <CategoryOrderCountsReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-delivery-estimates"
    path="/admin/reports/delivery-estimates"
    element={
      <RequireRole roles={['ADMIN']}>
        <DeliveryEstimatesReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-delivery-estimates-direct"
    path="/reports/delivery-estimates"
    element={
      <RequireRole roles={['ADMIN']}>
        <DeliveryEstimatesReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-customer-summary"
    path="/admin/reports/customer-summary"
    element={
      <RequireRole roles={['ADMIN']}>
        <CustomerSummaryReportPage />
      </RequireRole>
    }
  />,
  <Route
    key="report-customer-summary-direct"
    path="/reports/customer-summary"
    element={
      <RequireRole roles={['ADMIN']}>
        <CustomerSummaryReportPage />
      </RequireRole>
    }
  />,
];

export default adminRoutes;
