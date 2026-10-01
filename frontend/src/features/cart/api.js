// frontend/src/features/cart/api.js
// Wraps the shared api/client.js for Person 3 endpoints.
// Owned by Person 3.

import client from '../../api/client';

export const getCart = () => client.get('/cart');
export const addItem = ({ variantId, quantity }) => client.post('/cart/items', { variantId, quantity });
export const updateItem = (cartItemId, { quantity }) => client.put(`/cart/items/${cartItemId}`, { quantity });
export const removeItem = (cartItemId) => client.delete(`/cart/items/${cartItemId}`);
export const checkout = (checkoutData) => client.post('/checkout', checkoutData);

export default {
  getCart,
  addItem,
  updateItem,
  removeItem,
  checkout,
};
