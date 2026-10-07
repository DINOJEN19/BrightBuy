// frontend/src/features/cart/routes.jsx
// Exports Person 3's route fragment.
// Owned by Person 3.

import { Route } from 'react-router-dom';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import RequireAuth from '../../components/RequireAuth';

export const cartRoutes = [
  <Route key="cart" path="/cart" element={<CartPage />} />,
  <Route
    key="checkout"
    path="/checkout"
    element={
      <RequireAuth>
        <CheckoutPage />
      </RequireAuth>
    }
  />,
  <Route
    key="order-confirmation"
    path="/order-confirmation"
    element={
      <RequireAuth>
        <OrderConfirmationPage />
      </RequireAuth>
    }
  />,
];

export default cartRoutes;
