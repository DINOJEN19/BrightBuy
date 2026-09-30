// frontend/src/features/catalogue/components/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card" style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', margin: '8px' }}>
      <h3>{product.productName}</h3>
      <p>Brand: {product.brand}</p>
      <div className="categories">
        {product.categories && product.categories.map(c => (
          <span key={c.categoryId} style={{ marginRight: '4px', background: '#eee', padding: '2px 4px', fontSize: '12px' }}>
            {c.categoryName}
          </span>
        ))}
      </div>
      <div style={{ marginTop: '12px' }}>
        <Link to={`/products/${product.productId}`}>View Details</Link>
      </div>
    </div>
  );
};

export default ProductCard;
