// frontend/src/features/catalogue/components/CategoryFilter.jsx
import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-filter" style={{ marginBottom: '16px' }}>
      <label htmlFor="category-select" style={{ marginRight: '8px' }}>Filter by Category:</label>
      <select
        id="category-select"
        value={selectedCategory || ''}
        onChange={(e) => onSelectCategory(e.target.value)}
        style={{ padding: '8px' }}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.categoryId} value={c.categoryId}>
            {c.categoryName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
