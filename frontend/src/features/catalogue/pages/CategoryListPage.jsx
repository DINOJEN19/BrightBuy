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
        setCategories(response?.data?.data || []);
      } catch (err) {
        setError('Failed to load categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading categories...</p>;
  if (error) return <p style={{ color: '#dc2626', padding: '24px' }}>{error}</p>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#16352e', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Product Categories
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          Browse our curated departments and find essentials tailored to your needs.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '24px',
        alignItems: 'stretch',
      }}>
        {categories.map((c) => (
          <Link
            key={c.categoryId}
            to={`/products?category=${c.categoryId}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e6dd',
                borderRadius: '14px',
                minHeight: '200px',
                boxSizing: 'border-box',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(22, 53, 46, 0.12)';
                e.currentTarget.style.borderColor = '#18664f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e0e6dd';
              }}
            >
              <div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#eaf2e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: '#18664f',
                  marginBottom: '16px',
                  fontWeight: '700',
                }}>
                  {c.categoryName.charAt(0)}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#16352e',
                  margin: '0 0 10px 0',
                  lineHeight: '1.3',
                }}>
                  {c.categoryName}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#657468',
                  lineHeight: '1.5',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {c.description || 'Explore products in this category.'}
                </p>
              </div>

              <div style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px solid #f0f4ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: '600',
                color: '#18664f',
              }}>
                <span>Browse products</span>
                <span>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryListPage;
