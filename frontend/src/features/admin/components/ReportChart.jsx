// frontend/src/features/admin/components/ReportChart.jsx
// Reusable chart wrapper for the 5 management report views.
// Owned by Person 5.

import React from 'react';

const ReportChart = ({
  title,
  subtitle,
  data = [],
  valuePrefix = '',
  valueSuffix = '',
  type = 'column', // 'column' (vertical bars), 'horizontal' (horizontal bars)
  height = 240,
  emptyMessage = 'No chart data available for the selected range.',
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: '32px 20px',
          backgroundColor: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '14px',
        }}
      >
        <p style={{ margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1);

  const formatVal = (v) => {
    const num = Number(v) || 0;
    const formatted = num >= 1000 ? num.toLocaleString(undefined, { maximumFractionDigits: 2 }) : num;
    return `${valuePrefix}${formatted}${valueSuffix}`;
  };

  const defaultColors = [
    '#2563eb', // blue
    '#10b981', // emerald
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#6366f1', // indigo
  ];

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: '20px' }}>
          {title && (
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {type === 'horizontal' ? (
        // Horizontal Bar Chart
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {data.map((item, idx) => {
            const val = Number(item.value) || 0;
            const pct = Math.min(100, Math.max(2, (val / maxValue) * 100));
            const color = item.color || defaultColors[idx % defaultColors.length];

            return (
              <div key={item.label || idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155' }}>
                  <span style={{ fontWeight: '600' }}>{item.label}</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{formatVal(val)}</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '20px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: color,
                      borderRadius: '6px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Vertical Column Chart
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              height: `${height}px`,
              paddingTop: '20px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e2e8f0',
              gap: '12px',
            }}
          >
            {data.map((item, idx) => {
              const val = Number(item.value) || 0;
              const pct = Math.min(100, Math.max(3, (val / maxValue) * 100));
              const color = item.color || defaultColors[idx % defaultColors.length];

              return (
                <div
                  key={item.label || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                    flex: 1,
                    minWidth: '36px',
                    maxWidth: '80px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#475569',
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatVal(val)}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${pct}%`,
                      backgroundColor: color,
                      borderTopLeftRadius: '6px',
                      borderTopRightRadius: '6px',
                      transition: 'height 0.4s ease',
                    }}
                    title={`${item.label}: ${formatVal(val)}`}
                  />
                </div>
              );
            })}
          </div>
          {/* Labels row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            {data.map((item, idx) => (
              <div
                key={item.label || idx}
                style={{
                  flex: 1,
                  minWidth: '36px',
                  maxWidth: '80px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#64748b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={item.label}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportChart;
