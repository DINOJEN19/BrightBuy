// frontend/src/features/cart/components/DeliveryModeSelector.jsx
import React from 'react';

const DeliveryModeSelector = ({
  deliveryMode,
  onSelectMode,
  deliveryAddress,
  onAddressChange,
  error,
}) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1a202c' }}>
        Delivery Method
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Standard Delivery Option */}
        <div
          onClick={() => onSelectMode('STANDARD_DELIVERY')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            border: deliveryMode === 'STANDARD_DELIVERY' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            backgroundColor: deliveryMode === 'STANDARD_DELIVERY' ? '#eff6ff' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>Standard Delivery</span>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                fontWeight: '500',
              }}
            >
              5 - 7 Days
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Dispatched to your residential or office address. Required for doorstep delivery.
          </p>
        </div>

        {/* Store Pickup Option */}
        <div
          onClick={() => onSelectMode('STORE_PICKUP')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            border: deliveryMode === 'STORE_PICKUP' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            backgroundColor: deliveryMode === 'STORE_PICKUP' ? '#eff6ff' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>Store Pickup</span>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontWeight: '500',
              }}
            >
              Free / Fast
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Collect in-person from the main BrightBuy store counter in your destination city.
          </p>
        </div>
      </div>

      {/* Address Input (shown when Standard Delivery is chosen) */}
      {deliveryMode === 'STANDARD_DELIVERY' && (
        <div style={{ marginTop: '12px' }}>
          <label
            htmlFor="delivery-address"
            style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}
          >
            Street Address <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            id="delivery-address"
            rows="3"
            value={deliveryAddress || ''}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="e.g. 1044 Main Parkway, Suite 200, TX 75001"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryModeSelector;
