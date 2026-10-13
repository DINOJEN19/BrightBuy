// frontend/src/features/orders/pages/StockAdjustmentPage.jsx
// Staff-only form. Calls POST /inventory/stock-adjustments.
// Route is wrapped in RequireRole (WAREHOUSE_STAFF, ADMIN) in routes.jsx.

import React, { useState, useEffect, useRef } from 'react';
import { createStockAdjustment, getStockAdjustments, searchVariants } from '../api';

const label = { display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#1e293b' };
const input = { width: '100%', padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' };
const helperText = { fontSize: '12px', marginTop: '6px', color: '#64748b' };

const StockAdjustmentPage = () => {
  const [variantId, setVariantId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('RESTOCK');
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');

  // Autocomplete / Search state for products and variants
  const [searchTerm, setSearchTerm] = useState('');
  const [variantList, setVariantList] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchingVariants, setIsSearchingVariants] = useState(false);
  const dropdownRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessRuleError, setBusinessRuleError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [result, setResult] = useState(null);

  const [recentAdjustments, setRecentAdjustments] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch recent stock adjustment audit logs
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await getStockAdjustments({ limit: 15 });
      const data = response?.data?.data || response?.data;
      if (Array.isArray(data)) {
        setRecentAdjustments(data);
      }
    } catch {
      // Gracefully ignore history fetch errors in mock environments
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Search variants by SKU, Product Name, or Variant ID
  useEffect(() => {
    let active = true;
    const fetchVariants = async () => {
      setIsSearchingVariants(true);
      try {
        const response = await searchVariants({ q: searchTerm, limit: 30 });
        const list = response?.data?.data || [];
        if (active && Array.isArray(list)) {
          setVariantList(list);
          // If a variantId is already active, sync selectedVariant
          if (variantId && !selectedVariant) {
            const match = list.find((v) => String(v.variantId) === String(variantId));
            if (match) setSelectedVariant(match);
          }
        }
      } catch {
        // Fallback gracefully if search endpoint fails
      } finally {
        if (active) setIsSearchingVariants(false);
      }
    };

    const timer = setTimeout(fetchVariants, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm, variantId]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVariant = (v) => {
    setSelectedVariant(v);
    setVariantId(String(v.variantId));
    setSearchTerm('');
    setShowDropdown(false);
    setValidationError(null);
  };

  const handleManualIdChange = (idVal) => {
    setVariantId(idVal);
    const match = variantList.find((v) => String(v.variantId) === String(idVal));
    if (match) {
      setSelectedVariant(match);
    } else {
      setSelectedVariant(null);
    }
  };

  const handleTypeSelect = (type) => {
    setAdjustmentType(type);
    setValidationError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusinessRuleError(null);
    setValidationError(null);
    setResult(null);

    const variant = Number(variantId);
    const change = Number(quantityChange);

    if (!Number.isInteger(variant) || variant <= 0) {
      setValidationError('Please select a product or enter a valid Variant ID.');
      return;
    }

    if (!Number.isInteger(change) || change === 0) {
      setValidationError('Quantity change must be a non-zero whole number.');
      return;
    }

    // Enforce business rules per adjustment type:
    // RESTOCK: strictly positive (> 0), no 0 or negative numbers
    if (adjustmentType === 'RESTOCK' && change <= 0) {
      setValidationError('Restock does not allow negative or 0 numbers. Enter a positive number (e.g. 10).');
      return;
    }

    // DAMAGE: strictly negative (< 0), no 0 or positive numbers
    if (adjustmentType === 'DAMAGE' && change >= 0) {
      setValidationError('Damage write-off only allows negative numbers to reduce stock (e.g. -5).');
      return;
    }

    // CORRECTION: must not be 0
    if (adjustmentType === 'CORRECTION' && change === 0) {
      setValidationError('Correction quantity cannot be 0 (use positive to add, negative to remove).');
      return;
    }

    // For RESTOCK, reason is optional (defaults to 'Standard restock' if left blank).
    // For DAMAGE and CORRECTION, a reason is required.
    if (adjustmentType !== 'RESTOCK' && !reason.trim()) {
      setValidationError(`Please provide a reason for ${adjustmentType === 'DAMAGE' ? 'damage write-off' : 'inventory correction'}.`);
      return;
    }

    const finalReason = reason.trim() || (adjustmentType === 'RESTOCK' ? 'Standard restock' : '');

    setIsSubmitting(true);
    try {
      const response = await createStockAdjustment({
        variantId: variant,
        adjustmentType,
        quantityChange: change,
        reason: finalReason,
      });
      const savedData = response.data?.data || {};
      setResult(savedData);
      setQuantityChange('');
      setReason('');

      // Update selected variant's current stock in UI
      if (selectedVariant && savedData.newStockQuantity !== undefined) {
        setSelectedVariant({
          ...selectedVariant,
          stockQuantity: savedData.newStockQuantity,
        });
      }

      // Refresh audit history to display the newly created adjustment
      loadHistory();
    } catch (err) {
      const errCode = err?.code || err?.response?.data?.error?.code;
      const errMsg = err?.message || err?.response?.data?.error?.message;
      if (errCode === 'BUSINESS_RULE_VIOLATION' || err?.response?.status === 422) {
        setBusinessRuleError(errMsg || 'Stock adjustment rejected: stock cannot fall below zero.');
      } else {
        setValidationError(errMsg || 'An unexpected error occurred while saving the adjustment.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic input configurations based on active type
  const quantityProps = {
    RESTOCK: {
      min: '1',
      max: undefined,
      placeholder: 'e.g. 25',
      hint: 'Positive number (+): quantity to add to stock.',
      color: '#15803d',
    },
    DAMAGE: {
      min: undefined,
      max: '-1',
      placeholder: 'e.g. -5',
      hint: 'Negative number (−): quantity of damaged items to deduct from stock.',
      color: '#b91c1c',
    },
    CORRECTION: {
      min: undefined,
      max: undefined,
      placeholder: 'e.g. 10 or -3',
      hint: 'Enter a positive number (+) to add stock, or a negative number (−) to deduct stock.',
      color: '#0f766e',
    },
  }[adjustmentType];

  return (
    <div style={{ maxWidth: '840px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', marginBottom: '8px', color: '#0f172a', letterSpacing: '-0.02em' }}>Stock Adjustment</h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          Manage inventory counts, record inbound restocks, and write off damaged goods.
        </p>
      </div>

      {businessRuleError && (
        <div role="alert" style={{ padding: '16px 20px', backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '10px', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '16px', fontWeight: '700' }}>Adjustment rejected</h4>
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px', fontWeight: '500' }}>{businessRuleError}</p>
        </div>
      )}

      {validationError && (
        <div style={{ padding: '14px 18px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '10px', marginBottom: '24px', color: '#b45309', fontSize: '14px' }}>
          <strong>Check the form:</strong> {validationError}
        </div>
      )}

      {result && (
        <div role="status" style={{ padding: '16px 20px', backgroundColor: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '10px', marginBottom: '24px', color: '#15803d', fontSize: '14px' }}>
          <strong>Adjustment saved successfully!</strong> Adjustment #{result.adjustmentId}, new stock quantity: <strong>{result.newStockQuantity}</strong>
        </div>
      )}

      {/* Main Adjustment Form Card */}
      <form onSubmit={handleSubmit} style={{ padding: '28px', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)', marginBottom: '40px' }}>
        
        {/* Product / Variant Search & Selection */}
        <div style={{ marginBottom: '24px' }} ref={dropdownRef}>
          <label style={label}>Product Variant</label>

          {selectedVariant ? (
            /* Selected Variant Preview Card */
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#334155' }}>
                      ID #{selectedVariant.variantId}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                      SKU: {selectedVariant.sku}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                    {selectedVariant.productName}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {selectedVariant.variantName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedVariant(null); setVariantId(''); }}
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Change Item
                </button>
              </div>

              {/* Real-time Current & Projected Stock Preview */}
              <div style={{ display: 'flex', gap: '28px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '13px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Current shelf stock: </span>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>{selectedVariant.stockQuantity} units</strong>
                </div>
                {Number.isInteger(Number(quantityChange)) && Number(quantityChange) !== 0 && (
                  <div>
                    <span style={{ color: '#64748b' }}>Projected new stock: </span>
                    <strong style={{
                      fontSize: '15px',
                      color: selectedVariant.stockQuantity + Number(quantityChange) < 0 ? '#dc2626' : '#16a34a',
                    }}>
                      {selectedVariant.stockQuantity + Number(quantityChange)} units
                    </strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Search Input & Live Autocomplete Dropdown */
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by product title or SKU (e.g. BB-0001, Pulse)..."
                style={input}
              />

              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  marginTop: '4px',
                }}>
                  {isSearchingVariants ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
                      Searching catalogue...
                    </div>
                  ) : variantList.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                      No matching products found. You can enter an ID directly below.
                    </div>
                  ) : (
                    variantList.map((v) => (
                      <div
                        key={v.variantId}
                        onClick={() => handleSelectVariant(v)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
                            {v.productName} <span style={{ fontWeight: '400', color: '#64748b' }}>— {v.variantName}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            SKU: <strong>{v.sku}</strong> · ID #{v.variantId}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: v.stockQuantity > 0 ? '#15803d' : '#dc2626', backgroundColor: v.stockQuantity > 0 ? '#dcfce7' : '#fee2e2', padding: '3px 8px', borderRadius: '4px' }}>
                            {v.stockQuantity} in stock
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Direct ID fallback input (synced for test automation and fast manual entry) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Or enter direct Variant ID:</span>
                <input
                  id="variant-id"
                  type="number"
                  min="1"
                  value={variantId}
                  onChange={(e) => handleManualIdChange(e.target.value)}
                  placeholder="e.g. 1"
                  style={{ ...input, width: '110px', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Interactive Adjustment Type Selector Buttons */}
        <div style={{ marginBottom: '22px' }}>
          <label htmlFor="adjustment-type" style={label}>Adjustment Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '8px' }}>
            <button
              type="button"
              id="btn-restock"
              onClick={() => handleTypeSelect('RESTOCK')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 16px',
                borderRadius: '8px',
                border: adjustmentType === 'RESTOCK' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                backgroundColor: adjustmentType === 'RESTOCK' ? '#f0fdf4' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontWeight: '700', fontSize: '15px', color: adjustmentType === 'RESTOCK' ? '#15803d' : '#334155' }}>
                Restock
              </span>
            </button>

            <button
              type="button"
              id="btn-damage"
              onClick={() => handleTypeSelect('DAMAGE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 16px',
                borderRadius: '8px',
                border: adjustmentType === 'DAMAGE' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                backgroundColor: adjustmentType === 'DAMAGE' ? '#fef2f2' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontWeight: '700', fontSize: '15px', color: adjustmentType === 'DAMAGE' ? '#b91c1c' : '#334155' }}>
                Damage Write-Off
              </span>
            </button>

            <button
              type="button"
              id="btn-correction"
              onClick={() => handleTypeSelect('CORRECTION')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 16px',
                borderRadius: '8px',
                border: adjustmentType === 'CORRECTION' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: adjustmentType === 'CORRECTION' ? '#f0f9ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontWeight: '700', fontSize: '15px', color: adjustmentType === 'CORRECTION' ? '#0369a1' : '#334155' }}>
                Correction
              </span>
            </button>
          </div>

          {/* Hidden/synchronized select for backward compatibility & automated testing */}
          <select
            id="adjustment-type"
            value={adjustmentType}
            onChange={(e) => handleTypeSelect(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b', backgroundColor: '#f8fafc', outline: 'none' }}
          >
            <option value="RESTOCK">Restock</option>
            <option value="DAMAGE">Damage write-off</option>
            <option value="CORRECTION">Correction</option>
          </select>
        </div>

        {/* Quantity Change Input */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="quantity-change" style={label}>Quantity Change</label>
          <input
            id="quantity-change"
            type="number"
            min={quantityProps.min}
            max={quantityProps.max}
            value={quantityChange}
            onChange={(e) => setQuantityChange(e.target.value)}
            placeholder={quantityProps.placeholder}
            style={input}
          />
          <div style={{ ...helperText, color: quantityProps.color, fontWeight: '500' }}>
            {quantityProps.hint}
          </div>
        </div>

        {/* Reason / Audit Note */}
        <div style={{ marginBottom: '26px' }}>
          <label htmlFor="reason" style={label}>
            Reason / Audit Note {adjustmentType === 'RESTOCK' ? (
              <span style={{ fontWeight: '400', fontSize: '13px', color: '#64748b' }}>(Optional)</span>
            ) : (
              <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '700' }}>* (Required)</span>
            )}
          </label>
          <textarea
            id="reason"
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              adjustmentType === 'RESTOCK'
                ? 'Optional: e.g. Supplier delivery PO #4028 (defaults to "Standard restock" if left blank)'
                : adjustmentType === 'DAMAGE'
                ? 'Required: e.g. Dropped in transit, water damaged, defective lot #12'
                : 'Required: e.g. Physical inventory cycle count difference'
            }
            style={input}
          />
          <div style={helperText}>
            {adjustmentType === 'RESTOCK'
              ? 'Optional note for routine shipments or supplier deliveries.'
              : 'Required reason for inventory write-offs and reconciliations.'}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isSubmitting ? '#93c5fd' : '#1e3a8a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {isSubmitting ? 'Saving adjustment...' : 'Save adjustment'}
        </button>
      </form>

      {/* Stock Adjustments Audit Trail & Messages Log */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>
              Adjustment History &amp; Audit Trail
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Recent inventory modifications, recorded reasons, and timestamps.
            </p>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            disabled={isLoadingHistory}
            style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', cursor: 'pointer' }}
          >
            {isLoadingHistory ? 'Refreshing...' : 'Refresh Log'}
          </button>
        </div>

        {recentAdjustments.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
            {isLoadingHistory ? 'Loading adjustment records...' : 'No stock adjustments recorded yet. Save an adjustment above to view it in the audit trail.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 8px', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600' }}>Date &amp; Time</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600' }}>Variant</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600' }}>Change</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600' }}>Reason / Message</th>
                </tr>
              </thead>
              <tbody>
                {recentAdjustments.map((adj) => {
                  const isPositive = adj.quantityChange > 0;
                  const typeBadge = {
                    RESTOCK: { bg: '#dcfce7', text: '#15803d', label: 'Restock' },
                    DAMAGE: { bg: '#fee2e2', text: '#b91c1c', label: 'Damage' },
                    CORRECTION: { bg: '#e0f2fe', text: '#0369a1', label: 'Correction' },
                    ORDER_DECREMENT: { bg: '#f1f5f9', text: '#475569', label: 'Order Sale' },
                  }[adj.adjustmentType] || { bg: '#f1f5f9', text: '#475569', label: adj.adjustmentType };

                  const formattedDate = adj.adjustmentDate
                    ? new Date(adj.adjustmentDate).toLocaleString()
                    : '—';

                  return (
                    <tr key={adj.adjustmentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', color: '#64748b', fontWeight: '500' }}>
                        #{adj.adjustmentId}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#1e293b' }}>
                        <strong>Variant #{adj.variantId}</strong>
                        {adj.sku && <div style={{ fontSize: '11px', color: '#64748b' }}>{adj.sku}</div>}
                        {adj.productName && <div style={{ fontSize: '11px', color: '#64748b' }}>{adj.productName}</div>}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', backgroundColor: typeBadge.bg, color: typeBadge.text }}>
                          {typeBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '700', color: isPositive ? '#16a34a' : '#dc2626' }}>
                        {isPositive ? `+${adj.quantityChange}` : adj.quantityChange}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#334155', maxWidth: '280px', wordBreak: 'break-word' }}>
                        <span style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', display: 'inline-block' }}>
                          {adj.reason || <em style={{ color: '#94a3b8' }}>No reason recorded</em>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAdjustmentPage;
