// frontend/src/features/orders/pages/StockAdjustmentPage.jsx
// Staff-only form. Calls POST /inventory/stock-adjustments.
// Route is wrapped in RequireRole (WAREHOUSE_STAFF, ADMIN) in routes.jsx.
// No stock arithmetic here: the DB trigger decides if an adjustment is allowed (422 shown inline).

import React, { useState } from 'react';
import { createStockAdjustment } from '../api';

const label = { display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#334155' };
const input = { width: '100%', padding: '10px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

const StockAdjustmentPage = () => {
  const [variantId, setVariantId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('RESTOCK');
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessRuleError, setBusinessRuleError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusinessRuleError(null);
    setValidationError(null);
    setResult(null);

    const variant = Number(variantId);
    const change = Number(quantityChange);

    if (!Number.isInteger(variant) || variant <= 0) {
      setValidationError('Enter a valid variant ID (a positive whole number).');
      return;
    }
    if (!Number.isInteger(change) || change === 0) {
      setValidationError('Quantity change must be a whole number other than 0 (use a negative number to remove stock).');
      return;
    }
    if (!reason.trim()) {
      setValidationError('Please give a reason for this adjustment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createStockAdjustment({
        variantId: variant,
        adjustmentType,
        quantityChange: change,
        reason: reason.trim(),
      });
      setResult(response.data?.data || {});
      setQuantityChange('');
      setReason('');
    } catch (err) {
      const errCode = err?.code || err?.response?.data?.error?.code;
      const errMsg = err?.message || err?.response?.data?.error?.message;
      if (errCode === 'BUSINESS_RULE_VIOLATION' || err?.response?.status === 422) {
        setBusinessRuleError(errMsg || 'Stock adjustment rejected by a business rule.');
      } else {
        setValidationError(errMsg || 'An unexpected error occurred while saving the adjustment.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>Stock Adjustment</h1>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
        Restock, correct or write off stock for a product variant.
      </p>

      {businessRuleError && (
        <div role="alert" style={{ padding: '16px 20px', backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '8px', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '16px', fontWeight: '700' }}>Adjustment rejected</h4>
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px', fontWeight: '500' }}>{businessRuleError}</p>
        </div>
      )}

      {validationError && (
        <div style={{ padding: '14px 18px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', marginBottom: '24px', color: '#b45309', fontSize: '14px' }}>
          <strong>Check the form:</strong> {validationError}
        </div>
      )}

      {result && (
        <div role="status" style={{ padding: '16px 20px', backgroundColor: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '8px', marginBottom: '24px', color: '#15803d', fontSize: '14px' }}>
          <strong>Adjustment saved.</strong> Adjustment #{result.adjustmentId}, new stock quantity: <strong>{result.newStockQuantity}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="variant-id" style={label}>Variant ID</label>
          <input id="variant-id" type="number" min="1" value={variantId} onChange={(e) => setVariantId(e.target.value)} placeholder="e.g. 12" style={input} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="adjustment-type" style={label}>Adjustment type</label>
          <select id="adjustment-type" value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)} style={{ ...input, backgroundColor: '#fff' }}>
            <option value="RESTOCK">Restock</option>
            <option value="CORRECTION">Correction</option>
            <option value="DAMAGE">Damage write-off</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="quantity-change" style={label}>Quantity change</label>
          <input id="quantity-change" type="number" value={quantityChange} onChange={(e) => setQuantityChange(e.target.value)} placeholder="e.g. 25 or -3" style={input} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="reason" style={label}>Reason</label>
          <textarea id="reason" rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. New shipment received from supplier" style={input} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', padding: '14px', backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Saving...' : 'Save adjustment'}
        </button>
      </form>
    </div>
  );
};

export default StockAdjustmentPage;
