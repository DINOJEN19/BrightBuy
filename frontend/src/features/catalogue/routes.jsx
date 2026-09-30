// frontend/src/features/catalogue/routes.jsx
import React from 'react';
import { Route } from 'react-router-dom';
import CategoryListPage from './pages/CategoryListPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';

export const catalogueRoutes = [
  <Route key="category-list" path="/categories" element={<CategoryListPage />} />,
  <Route key="product-list" path="/products" element={<ProductListPage />} />,
  <Route key="product-detail" path="/products/:id" element={<ProductDetailPage />} />,
];
