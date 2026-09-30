// frontend/src/features/catalogue/api.js
import client from '../../api/client';

export const getCategories = () => client.get('/categories');
export const getProducts = (params) => client.get('/products', { params });
export const getProduct = (id) => client.get(`/products/${id}`);
export const getVariant = (id) => client.get(`/variants/${id}`);
