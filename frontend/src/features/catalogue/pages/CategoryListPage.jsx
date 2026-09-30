// frontend/src/features/catalogue/pages/CategoryListPage.jsx
import React, { useEffect, useState } from 'react';
import { getCategories } from '../api';
import { Link } from 'react-router-dom';

const CategoryListPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data.data);
      } catch (err) {
        setError('Failed to load categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>Product Categories</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {categories.map((c) => (
          <Link key={c.categoryId} to={`/products?category=${c.categoryId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
              <h3>{c.categoryName}</h3>
              {c.description && <p style={{ fontSize: '14px', color: '#666' }}>{c.description}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryListPage;
