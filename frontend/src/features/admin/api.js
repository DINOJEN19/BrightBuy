// frontend/src/features/admin/api.js
// Wraps the shared api/client.js for Person 5 endpoints.
// Owned by Person 5.

import client from '../../api/client';

// Management Reports (Admin only)
export const getQuarterlySales = (params) => client.get('/reports/quarterly-sales', { params });
export const getTopSellingProducts = (params) => client.get('/reports/top-selling-products', { params });
export const getCategoryOrderCounts = () => client.get('/reports/category-order-counts');
export const getDeliveryEstimates = () => client.get('/reports/delivery-estimates');
export const getCustomerSummary = () => client.get('/reports/customer-summary');

// Catalogue Administration (Admin only)
export const createCategory = (data) => client.post('/admin/categories', data);
export const createProduct = (data) => client.post('/admin/products', data);
export const updateVariant = (variantId, data) => client.put(`/admin/variants/${variantId}`, data);

// Helper to load categories for product creation forms
export const getCategories = () => client.get('/categories');

export default {
  getQuarterlySales,
  getTopSellingProducts,
  getCategoryOrderCounts,
  getDeliveryEstimates,
  getCustomerSummary,
  createCategory,
  createProduct,
  updateVariant,
  getCategories,
};
