// frontend/src/features/admin/pages/admin/ProductFormPage.jsx
// Create products with category links and variants, or update existing variants.
// Calls POST /api/v1/admin/products and PUT /api/v1/admin/variants/:id.
// Owned by Person 5.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createProduct, updateVariant, getCategories } from '../../api';

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

const ProductFormPage = () => {
  const [activeTab, setActiveTab] = useState('CREATE'); // 'CREATE' | 'UPDATE_VARIANT'

  // Categories list
  const [availableCategories, setAvailableCategories] = useState([]);

  // Product form state
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [variants, setVariants] = useState([
    { sku: '', variantName: '', colour: '', memorySize: '', price: '', stockQuantity: '0' },
  ]);

  // Variant update state
  const [updateVariantId, setUpdateVariantId] = useState('');
  const [updateVariantName, setUpdateVariantName] = useState('');
  const [updatePrice, setUpdatePrice] = useState('');
  const [updateStatus, setUpdateStatus] = useState('ACTIVE');
  const [variantUpdateResult, setVariantUpdateResult] = useState(null);

  // Status indicators
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skuTakenError, setSkuTakenError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        setAvailableCategories(res.data?.data || []);
      } catch {
        // Fallback demo categories if backend is unreachable
        setAvailableCategories([
          { categoryId: 1, categoryName: 'Smartphones' },
          { categoryId: 2, categoryName: 'Laptops' },
          { categoryId: 3, categoryName: 'Audio' },
        ]);
      }
    };
    loadCategories();
  }, []);

  const handleCategoryToggle = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { sku: '', variantName: '', colour: '', memorySize: '', price: '', stockQuantity: '0' },
    ]);
  };

  const removeVariantRow = (index) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Create Product Submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSkuTakenError(null);
    setValidationError(null);
    setSuccessResult(null);

    if (!productName.trim()) {
      setValidationError('Product name is required.');
      return;
    }
    if (selectedCategoryIds.length === 0 || variants.length === 0) {
      setValidationError('Every product requires at least one category and one variant.');
      return;
    }

    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.sku.trim()) {
        setValidationError(`Variant #${i + 1} requires an SKU.`);
        return;
      }
      if (!v.variantName.trim()) {
        setValidationError(`Variant #${i + 1} requires a variant name.`);
        return;
      }
      const priceNum = parseFloat(v.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setValidationError(`Variant #${i + 1} requires a price greater than 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        productName: productName.trim(),
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        categoryIds: selectedCategoryIds,
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          variantName: v.variantName.trim(),
          colour: v.colour.trim() || undefined,
          memorySize: v.memorySize.trim() || undefined,
          price: parseFloat(v.price),
          stockQuantity: parseInt(v.stockQuantity, 10) || 0,
        })),
      };

      const res = await createProduct(payload);
      setSuccessResult(res.data?.data || {});
      setProductName('');
      setDescription('');
      setBrand('');
      setSelectedCategoryIds([]);
      setVariants([
        { sku: '', variantName: '', colour: '', memorySize: '', price: '', stockQuantity: '0' },
      ]);
    } catch (err) {
      const code = err?.response?.data?.error?.code || err?.code;
      const message = err?.response?.data?.error?.message || err?.message;

      if (code === 'SKU_TAKEN' || err?.response?.status === 409) {
        setSkuTakenError(message || 'This SKU is already in use.');
      } else if (err?.response?.status === 403) {
        setValidationError(
          message || 'Access denied: Admin role required to create products. Please switch to the Admin role using the header toggle.'
        );
      } else {
        setValidationError(message || 'Failed to create product.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Variant Submit
  const handleVariantUpdateSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);
    setVariantUpdateResult(null);

    const vId = Number(updateVariantId);
    if (!Number.isInteger(vId) || vId <= 0) {
      setValidationError('Please provide a valid variant ID.');
      return;
    }

    const payload = {};
    if (updateVariantName.trim()) payload.variantName = updateVariantName.trim();
    if (updatePrice) {
      const p = parseFloat(updatePrice);
      if (isNaN(p) || p <= 0) {
        setValidationError('Price must be greater than zero.');
        return;
      }
      payload.price = p;
    }
    if (updateStatus) payload.status = updateStatus;

    if (Object.keys(payload).length === 0) {
      setValidationError('Please provide at least one field to update (name, price, or status).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateVariant(vId, payload);
      setVariantUpdateResult(res.data?.data || {});
    } catch (err) {
      const errMsg = err?.response?.data?.error?.message || err?.message;
      setValidationError(errMsg || 'Failed to update variant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
          ← Back to Admin Dashboard
        </Link>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
          Catalogue Product Management
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Create products with multiple variants, or update existing variant prices and status.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('CREATE'); setValidationError(null); }}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '700',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'CREATE' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'CREATE' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Add New Product
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('UPDATE_VARIANT'); setValidationError(null); }}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '700',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'UPDATE_VARIANT' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'UPDATE_VARIANT' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Update Existing Variant
        </button>
      </div>

      {/* Error alerts */}
      {skuTakenError && (
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
            SKU Conflict
          </h4>
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px', fontWeight: '500' }}>
            {skuTakenError}
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
          <strong>Validation Warning:</strong> {validationError}
        </div>
      )}

      {/* Success alert */}
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
          <strong>Product created successfully!</strong>
          <p style={{ margin: '4px 0 0 0' }}>
            Product ID: #{successResult.productId} | Created Variant IDs: {Array.isArray(successResult.variantIds) ? successResult.variantIds.join(', ') : 'None'}
          </p>
        </div>
      )}

      {variantUpdateResult && (
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
          <strong>Variant updated successfully!</strong>
          <p style={{ margin: '4px 0 0 0' }}>
            Variant #{variantUpdateResult.variantId} ({variantUpdateResult.sku}): {variantUpdateResult.variantName} - ${variantUpdateResult.price} [{variantUpdateResult.status}]
          </p>
        </div>
      )}

      {activeTab === 'CREATE' ? (
        <form
          onSubmit={handleProductSubmit}
          style={{
            padding: '28px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label htmlFor="product-name" style={labelStyle}>
                Product Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="product-name"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. UltraBook Pro 16"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="brand-name" style={labelStyle}>
                Brand
              </label>
              <input
                id="brand-name"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Dell"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="product-desc" style={labelStyle}>
              Description
            </label>
            <textarea
              id="product-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. High performance laptop designed for power users."
              style={inputStyle}
            />
          </div>

          {/* Categories Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>
              Categories <span style={{ color: '#ef4444' }}>* (Select at least one)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
              {availableCategories.map((c) => {
                const id = c.categoryId ?? c.category_id;
                const isChecked = selectedCategoryIds.includes(id);
                return (
                  <label
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isChecked ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                      color: isChecked ? '#1d4ed8' : '#334155',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(id)}
                    />
                    {c.categoryName ?? c.category_name}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Variants section */}
          <div style={{ marginBottom: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                  Product Variants
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Every product requires at least one variant.</span>
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2563eb',
                  cursor: 'pointer',
                }}
              >
                + Add Another Variant
              </button>
            </div>

            {variants.map((v, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                    Variant #{idx + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>SKU *</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-16-BLK"
                      value={v.sku}
                      onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Variant Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. 16GB / 512GB SSD"
                      value={v.variantName}
                      onChange={(e) => handleVariantChange(idx, 'variantName', e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 1499.00"
                      value={v.price}
                      onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Initial Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={v.stockQuantity}
                      onChange={(e) => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Colour</label>
                    <input
                      type="text"
                      placeholder="e.g. Space Gray"
                      value={v.colour}
                      onChange={(e) => handleVariantChange(idx, 'colour', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Memory Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 512GB"
                      value={v.memorySize}
                      onChange={(e) => handleVariantChange(idx, 'memorySize', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            ))}
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
            }}
          >
            {isSubmitting ? 'Saving Product...' : 'Create Product with Variants'}
          </button>
        </form>
      ) : (
        /* Update Variant Tab */
        <form
          onSubmit={handleVariantUpdateSubmit}
          style={{
            padding: '28px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="update-variant-id" style={labelStyle}>
              Variant ID <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="update-variant-id"
              type="number"
              min="1"
              value={updateVariantId}
              onChange={(e) => setUpdateVariantId(e.target.value)}
              placeholder="e.g. 10"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="update-variant-name" style={labelStyle}>
              New Variant Name
            </label>
            <input
              id="update-variant-name"
              type="text"
              value={updateVariantName}
              onChange={(e) => setUpdateVariantName(e.target.value)}
              placeholder="e.g. Midnight Black 256GB"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="update-variant-price" style={labelStyle}>
              New Price ($)
            </label>
            <input
              id="update-variant-price"
              type="number"
              step="0.01"
              min="0.01"
              value={updatePrice}
              onChange={(e) => setUpdatePrice(e.target.value)}
              placeholder="e.g. 1299.99"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="update-variant-status" style={labelStyle}>
              Status
            </label>
            <select
              id="update-variant-status"
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
              style={{ ...inputStyle, backgroundColor: '#fff' }}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISCONTINUED">DISCONTINUED</option>
            </select>
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
            }}
          >
            {isSubmitting ? 'Updating Variant...' : 'Update Variant'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProductFormPage;
