// frontend/src/features/admin/pages/admin/CategoryFormPage.jsx
// Create new catalogue categories. Calls POST /api/v1/admin/categories.
// Owned by Person 5.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createCategory } from '../../api';

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '6px',
  color: '#334155',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
};

const CategoryFormPage = () => {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryExistsError, setCategoryExistsError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCategoryExistsError(null);
    setValidationError(null);
    setSuccessResult(null);

    const cleanName = categoryName.trim();
    if (!cleanName) {
      setValidationError('Category name is required.');
      return;
    }
    if (cleanName.length > 60) {
      setValidationError('Category name cannot exceed 60 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCategory({
        categoryName: cleanName,
        description: description.trim() || undefined,
      });

      setSuccessResult(res.data?.data || {});
      setCategoryName('');
      setDescription('');
    } catch (err) {
      const code = err?.code || err?.response?.data?.error?.code;
      const message = err?.message || err?.response?.data?.error?.message;

      if (code === 'CATEGORY_EXISTS' || err?.response?.status === 409) {
        setCategoryExistsError(message || 'A category with this name already exists.');
      } else {
        setValidationError(message || 'Failed to create category.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
          Create New Category
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Add a product category to the BrightBuy catalogue master records.
        </p>
      </div>

      {categoryExistsError && (
        <div
          role="alert"
          style={{
            padding: '16px 20px',
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '15px', fontWeight: '700' }}>
            Category Already Exists
          </h4>
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px', fontWeight: '500' }}>
            {categoryExistsError}
          </p>
        </div>
      )}

      {validationError && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#b45309',
            fontSize: '14px',
          }}
        >
          <strong>Validation Error:</strong> {validationError}
        </div>
      )}

      {successResult && (
        <div
          role="status"
          style={{
            padding: '16px 20px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#15803d',
            fontSize: '14px',
          }}
        >
          <strong>Category created successfully!</strong> Category ID: #{successResult.categoryId}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <label htmlFor="category-name" style={labelStyle}>
            Category Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="category-name"
            type="text"
            maxLength={60}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="e.g. Smart Watches"
            style={inputStyle}
            required
          />
          <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
            Maximum 60 characters. Must be unique.
          </span>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="category-desc" style={labelStyle}>
            Description <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(Optional)</span>
          </label>
          <textarea
            id="category-desc"
            rows={3}
            maxLength={255}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Wearable fitness trackers and smart watches"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {isSubmitting ? 'Creating Category...' : 'Create Category'}
        </button>
      </form>
    </div>
  );
};

export default CategoryFormPage;
