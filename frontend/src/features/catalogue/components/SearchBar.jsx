// frontend/src/features/catalogue/components/SearchBar.jsx
import React, { useState } from 'react';

const SearchBar = ({ initialQuery, onSearch }) => {
  const [query, setQuery] = useState(initialQuery || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: '8px', width: '250px' }}
      />
      <button type="submit" style={{ padding: '8px 16px', marginLeft: '8px' }}>Search</button>
    </form>
  );
};

export default SearchBar;
