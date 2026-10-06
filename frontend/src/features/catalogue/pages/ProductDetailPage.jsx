import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../api';
import client from '../../../api/client';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addFeedback, setAddFeedback] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProduct(id);
        const p = response.data.data;
        setProduct(p);
        if (p.variants && p.variants.length > 0) {
          setSelectedVariant(p.variants[0]);
        }
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAdding(true);
    setAddFeedback('');
    try {
      await client.post('/cart/items', { variantId: selectedVariant.variantId, quantity: 1 });
      setAddFeedback('Item added to cart!');
      setTimeout(() => navigate('/cart'), 600);
    } catch (err) {
      setAddFeedback(err?.response?.data?.error?.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <p>Loading product...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!product) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{product.productName}</h1>
      <p style={{ color: '#555', fontSize: '18px' }}>Brand: {product.brand}</p>
      <p>{product.description}</p>

      {product.variants && product.variants.length > 0 && (
        <div style={{ marginTop: '32px', padding: '24px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>Variants</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {product.variants.map((v) => (
              <button
                key={v.variantId}
                onClick={() => setSelectedVariant(v)}
                style={{
                  padding: '8px 16px',
                  border: selectedVariant?.variantId === v.variantId ? '2px solid #0056b3' : '1px solid #ccc',
                  background: selectedVariant?.variantId === v.variantId ? '#e6f2ff' : '#fff',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                {v.variantName}
              </button>
            ))}
          </div>

          {selectedVariant && (
            <div>
              <p><strong>SKU:</strong> {selectedVariant.sku}</p>
              {selectedVariant.colour && <p><strong>Colour:</strong> {selectedVariant.colour}</p>}
              {selectedVariant.memorySize && <p><strong>Memory:</strong> {selectedVariant.memorySize}</p>}
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>${selectedVariant.price.toFixed(2)}</p>
              <p style={{ color: selectedVariant.inStock > 0 ? 'green' : 'red' }}>
                {selectedVariant.inStock > 0 ? `In Stock (${selectedVariant.inStock})` : 'Out of Stock'}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  disabled={selectedVariant.inStock <= 0 || adding}
                  onClick={handleAddToCart}
                  style={{
                    padding: '12px 24px',
                    background: '#0056b3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedVariant.inStock > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 600
                  }}
                >
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
                {addFeedback && <span style={{ color: addFeedback.includes('added') ? 'green' : 'red' }}>{addFeedback}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;

