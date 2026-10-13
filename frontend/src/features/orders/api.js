// frontend/src/features/orders/api.js
// Wraps the shared api/client.js


import client from '../../api/client';

export const getOrders = (params) => client.get('/orders', { params });
export const getOrder = (orderId) => client.get(`/orders/${orderId}`);
export const getOrderDelivery = (orderId) => client.get(`/orders/${orderId}/delivery`);
export const getOrderPayment = (orderId) => client.get(`/orders/${orderId}/payment`);
export const createStockAdjustment = (data) => client.post('/inventory/stock-adjustments', data);
export const getStockAdjustments = (params) => client.get('/inventory/stock-adjustments', { params });
export const searchVariants = (params) => client.get('/inventory/variants', { params });

export default {
  getOrders,
  getOrder,
  getOrderDelivery,
  getOrderPayment,
  createStockAdjustment,
  getStockAdjustments,
  searchVariants,
};


