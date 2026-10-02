// frontend/src/features/orders/components/OrderStatusBadge.jsx
// Colour-coded pill for order, delivery and payment statuses.
// NOTE: status names below are assumed. Unknown statuses fall back to grey, so nothing breaks.

import React from 'react';

const STATUS_COLOURS = {
  // order
  CONFIRMED: { bg: '#dbeafe', fg: '#1d4ed8' },
  PROCESSING: { bg: '#e0e7ff', fg: '#3730a3' },
  CANCELLED: { bg: '#fee2e2', fg: '#b91c1c' },
  // delivery
  PENDING: { bg: '#fef3c7', fg: '#b45309' },
  SHIPPED: { bg: '#e0e7ff', fg: '#3730a3' },
  DISPATCHED: { bg: '#e0e7ff', fg: '#3730a3' },
  IN_TRANSIT: { bg: '#e0e7ff', fg: '#3730a3' },
  READY_FOR_PICKUP: { bg: '#dbeafe', fg: '#1d4ed8' },
  DELIVERED: { bg: '#dcfce7', fg: '#15803d' },
  // payment
  PAID: { bg: '#dcfce7', fg: '#15803d' },
  COMPLETED: { bg: '#dcfce7', fg: '#15803d' },
  FAILED: { bg: '#fee2e2', fg: '#b91c1c' },
  REFUNDED: { bg: '#f1f5f9', fg: '#475569' },
};

const FALLBACK = { bg: '#f1f5f9', fg: '#475569' };

const OrderStatusBadge = ({ status }) => {
  if (!status) return <span style={{ color: '#94a3b8', fontSize: '13px' }}>N/A</span>;
  const colours = STATUS_COLOURS[status] || FALLBACK;
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '12px',
        fontWeight: '700',
        padding: '3px 10px',
        borderRadius: '12px',
        backgroundColor: colours.bg,
        color: colours.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {String(status).replace(/_/g, ' ')}
    </span>
  );
};

export default OrderStatusBadge;
