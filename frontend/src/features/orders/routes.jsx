// frontend/src/features/orders/routes.jsx


import React from 'react';
import { Route } from 'react-router-dom';
import RequireRole from '../../components/RequireRole'; // Person 1's guard (ASSUMED prop name: roles)
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import StockAdjustmentPage from './pages/StockAdjustmentPage';

export const ordersRoutes = [
  <Route key="order-history" path="/orders" element={<OrderHistoryPage />} />,
  <Route key="order-detail" path="/orders/:orderId" element={<OrderDetailPage />} />,
  <Route
    key="stock-adjustments"
    path="/inventory/stock-adjustments"
    element={
      <RequireRole roles={['WAREHOUSE_STAFF', 'ADMIN']}>
        <StockAdjustmentPage />
      </RequireRole>
    }
  />,
];

export default ordersRoutes;
