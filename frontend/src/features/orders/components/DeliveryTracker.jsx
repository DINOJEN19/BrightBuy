// frontend/src/features/orders/components/DeliveryTracker.jsx
// Shows delivery details and a simple progress line.
// NOTE: STEPS are assumed delivery_status values. Adjust to match the DELIVERY table if different.

import React from 'react';
import OrderStatusBadge from './OrderStatusBadge';

const STEPS = ['PENDING', 'DISPATCHED', 'DELIVERED'];

const formatDate = (value) => {
  if (!value) return 'Not available yet';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const DeliveryTracker = ({ delivery }) => {
  if (!delivery) {
    return <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No delivery information for this order.</p>;
  }

  const currentIndex = STEPS.indexOf(delivery.deliveryStatus);
  const isPickup = delivery.deliveryMode === 'STORE_PICKUP';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontWeight: '600', color: '#1e293b' }}>
          {isPickup ? 'Store Pickup' : 'Standard Delivery'}
        </span>
        <OrderStatusBadge status={delivery.deliveryStatus} />
      </div>

      {currentIndex >= 0 && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          {STEPS.map((step, i) => {
            const done = i <= currentIndex;
            return (
              <React.Fragment key={step}>
                <div style={{ textAlign: 'center', minWidth: '72px' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      margin: '0 auto 6px auto',
                      backgroundColor: done ? '#2563eb' : '#e2e8f0',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: done ? '#1e293b' : '#94a3b8', fontWeight: done ? '600' : '400' }}>
                    {step.charAt(0) + step.slice(1).toLowerCase()}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '3px', backgroundColor: i < currentIndex ? '#2563eb' : '#e2e8f0', marginBottom: '20px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Destination</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{delivery.destinationCity || 'N/A'}</span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Estimated delivery</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>{formatDate(delivery.estimatedDeliveryDate)}</span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Delivered on</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{formatDate(delivery.actualDeliveryDate)}</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracker;
