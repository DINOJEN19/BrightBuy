// frontend/src/features/cart/routes.jsx
// Exports Person 3's route fragment.
// Owned by Person 3.

import React from 'react';
import { Route } from 'react-router-dom';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';

export const cartRoutes = [
  <Route key="cart" path="/cart" element={<CartPage />} />,
  <Route key="checkout" path="/checkout" element={<CheckoutPage />} />,
  <Route key="order-confirmation" path="/order-confirmation" element={<OrderConfirmationPage />} />,
];

export default cartRoutes;
