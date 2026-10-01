// frontend/src/features/cart/components/PaymentMethodSelector.jsx
import React from 'react';

const PaymentMethodSelector = ({
  paymentMethod,
  onSelectMethod,
  cardDetails = {},
  onCardDetailsChange,
  error,
}) => {
  const handleCardNumberChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 16);
    // Format into blocks of 4 digits: "#### #### #### ####"
    const formatted = rawValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    onCardDetailsChange('cardNumber', formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    onCardDetailsChange('expiryDate', val);
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    onCardDetailsChange('cvv', val);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1a202c' }}>
        Payment Method
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Card Payment Option */}
        <div
          onClick={() => onSelectMethod('CARD_PAYMENT')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            border: paymentMethod === 'CARD_PAYMENT' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            backgroundColor: paymentMethod === 'CARD_PAYMENT' ? '#eff6ff' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>Card Payment</span>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
                fontWeight: '500',
              }}
            >
              Instant
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Pay securely with Credit or Debit card (Visa, Mastercard, Amex).
          </p>
        </div>

        {/* Cash On Delivery Option */}
        <div
          onClick={() => onSelectMethod('CASH_ON_DELIVERY')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            border: paymentMethod === 'CASH_ON_DELIVERY' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            backgroundColor: paymentMethod === 'CASH_ON_DELIVERY' ? '#eff6ff' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>Cash on Delivery</span>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                fontWeight: '500',
              }}
            >
              On Arrival
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Pay in cash when your order is delivered to your door or upon pickup.
          </p>
        </div>
      </div>

      {/* Card Details Form (displayed when Card Payment is selected) */}
      {paymentMethod === 'CARD_PAYMENT' && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginTop: '12px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label
              htmlFor="cardholder-name"
              style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#334155' }}
            >
              Cardholder Name
            </label>
            <input
              id="cardholder-name"
              type="text"
              placeholder="e.g. John Doe"
              value={cardDetails.cardholderName || ''}
              onChange={(e) => onCardDetailsChange('cardholderName', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label
              htmlFor="card-number"
              style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#334155' }}
            >
              Card Number (13-19 digits)
            </label>
            <input
              id="card-number"
              type="text"
              placeholder="4532 1111 2222 3333"
              value={cardDetails.cardNumber || ''}
              onChange={handleCardNumberChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                borderRadius: '6px',
                border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
                boxSizing: 'border-box',
                outline: 'none',
                letterSpacing: '1px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                htmlFor="expiry-date"
                style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#334155' }}
              >
                Expiry Date (MM/YY)
              </label>
              <input
                id="expiry-date"
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiryDate || ''}
                onChange={handleExpiryChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="cvv"
                style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#334155' }}
              >
                CVV / CVC (3-4 digits)
              </label>
              <input
                id="cvv"
                type="password"
                placeholder="123"
                value={cardDetails.cvv || ''}
                onChange={handleCvvChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: '8px 0 0 0' }}>{error}</p>
          )}

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
            <span style={{ fontWeight: '700' }}>[SSL]</span>
            <span>256-Bit SSL Encrypted & Protected Payment Processing</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
