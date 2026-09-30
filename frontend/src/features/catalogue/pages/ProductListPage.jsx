// frontend/src/features/catalogue/pages/ProductListPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });

  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    getCategories().then(res => setCategories(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getProducts({ q: query, category: categoryId, page });
        setProducts(response.data.data);
        setMeta(response.data.meta);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, categoryId, page]);

  const handleSearch = (newQuery) => {
    setSearchParams(params => {
      if (newQuery) params.set('q', newQuery);
      else params.delete('q');
      params.set('page', 1);
      return params;
    });
  };

  const handleCategorySelect = (newCategory) => {
    setSearchParams(params => {
      if (newCategory) params.set('category', newCategory);
      else params.delete('category');
      params.set('page', 1);
      return params;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams(params => {
      params.set('page', newPage);
      return params;
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>Products</h2>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SearchBar initialQuery={query} onSearch={handleSearch} />
        <CategoryFilter categories={categories} selectedCategory={categoryId} onSelectCategory={handleCategorySelect} />
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {products.length === 0 ? <p>No products found.</p> : products.map(p => <ProductCard key={p.productId} product={p} />)}
          </div>
          <div style={{ marginTop: '24px' }}>
            <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)} style={{ marginRight: '8px' }}>Previous</button>
            <span>Page {meta.page} (Total: {meta.total} items)</span>
            <button disabled={page * meta.pageSize >= meta.total} onClick={() => handlePageChange(page + 1)} style={{ marginLeft: '8px' }}>Next</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductListPage;
