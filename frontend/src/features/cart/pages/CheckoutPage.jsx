// frontend/src/features/cart/pages/CheckoutPage.jsx
// Handles checkout orchestration, address/payment collection, and inline 422 business-rule errors.
// Owned by Person 3.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, checkout } from '../api';
import DeliveryModeSelector from '../components/DeliveryModeSelector';
import PaymentMethodSelector from '../components/PaymentMethodSelector';

const MAIN_CITIES = ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'];

const CheckoutPage = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loadingCart, setLoadingCart] = useState(true);

  // Form states
  const [destinationCity, setDestinationCity] = useState('Dallas');
  const [customCity, setCustomCity] = useState('');
  const [isOtherCity, setIsOtherCity] = useState(false);

  const [deliveryMode, setDeliveryMode] = useState('STANDARD_DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('CARD_PAYMENT');
  const [cardDetails, setCardDetails] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  // Errors and feedback states
  const [businessRuleError, setBusinessRuleError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await getCart();
        setCart(res.data?.data || null);
      } catch (err) {
        setValidationError('Failed to retrieve cart items. Please ensure you are logged in.');
      } finally {
        setLoadingCart(false);
      }
    };
    fetchCart();
  }, []);

  const handleCardDetailsChange = (field, value) => {
    setCardDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleCitySelectChange = (e) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setIsOtherCity(true);
      setDestinationCity(customCity || '');
    } else {
      setIsOtherCity(false);
      setDestinationCity(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusinessRuleError(null);
    setValidationError(null);

    const activeCity = isOtherCity ? customCity.trim() : destinationCity;

    // Client-side quick checks
    if (!activeCity) {
      setValidationError('Please specify your destination city.');
      return;
    }

    if (deliveryMode === 'STANDARD_DELIVERY' && (!deliveryAddress || !deliveryAddress.trim())) {
      setValidationError('A street address is required for Standard Delivery.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        deliveryMode,
        deliveryAddress: deliveryMode === 'STANDARD_DELIVERY' ? deliveryAddress.trim() : null,
        destinationCity: activeCity,
        paymentMethod,
        cardDetails: paymentMethod === 'CARD_PAYMENT' ? cardDetails : undefined,
      };

      const response = await checkout(payload);
      const confirmationData = response.data?.data;

      // Navigate to order confirmation with state
      navigate('/order-confirmation', {
        state: {
          orderId: confirmationData?.orderId,
          estimatedDeliveryDate: confirmationData?.estimatedDeliveryDate,
          orderStatus: confirmationData?.orderStatus || 'CONFIRMED',
          destinationCity: activeCity,
          deliveryMode,
          paymentMethod,
          total: cart?.total || 0,
        },
      });
    } catch (err) {
      // Check for 422 BUSINESS_RULE_VIOLATION from sp_PlaceOrder
      const errCode = err?.code || err?.response?.data?.error?.code;
      const errMsg = err?.message || err?.response?.data?.error?.message;

      if (errCode === 'BUSINESS_RULE_VIOLATION' || err?.response?.status === 422) {
        // Render 422 business-rule error inline as required by TASK.md
        setBusinessRuleError(errMsg || 'A business rule was violated during order placement.');
      } else {
        setValidationError(errMsg || 'An unexpected error occurred during checkout.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCart) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#64748b' }}>Preparing your checkout session...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ padding: '36px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2>Your Cart is Empty</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            You cannot proceed to checkout without any items in your cart.
          </p>
          <Link
            to="/products"
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
            }}
          >
            Go to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/cart" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
          &larr; Return to Cart
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px', color: '#0f172a' }}>
          Checkout & Order Confirmation
        </h1>
      </div>

      {/* Prominent 422 Business-Rule Error Banner (Requirement: renders 422 business-rule errors inline) */}
      {businessRuleError && (
        <div
          role="alert"
          style={{
            padding: '16px 20px',
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1, fontWeight: 'bold', color: '#dc2626' }}>[!]</span>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '16px', fontWeight: '700' }}>
              Business Rule Violation
            </h4>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px', fontWeight: '500' }}>
              {businessRuleError}
            </p>
            <p style={{ margin: '6px 0 0 0', color: '#7f1d1d', fontSize: '12px' }}>
              Note: This restriction is enforced directly by the database stored procedure (sp_PlaceOrder).
            </p>
          </div>
        </div>
      )}

      {/* General Validation Error Banner */}
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

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Left Column: Checkout Inputs */}
          <div>
            {/* Destination City Selection */}
            <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1a202c' }}>
                1. Destination City
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                Main cities (Houston, Dallas, Austin, San Antonio, Fort Worth) receive expedited 5-day delivery estimate.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <select
                  value={isOtherCity ? 'OTHER' : destinationCity}
                  onChange={handleCitySelectChange}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    outline: 'none',
                    minWidth: '220px',
                  }}
                >
                  {MAIN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city} (Main City - 5 Days)
                    </option>
                  ))}
                  <option value="OTHER">Other Texas / National City (7 Days)</option>
                </select>

                {isOtherCity && (
                  <input
                    type="text"
                    placeholder="Enter city name..."
                    value={customCity}
                    onChange={(e) => {
                      setCustomCity(e.target.value);
                      setDestinationCity(e.target.value);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      flex: 1,
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Delivery Mode Selection */}
            <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <DeliveryModeSelector
                deliveryMode={deliveryMode}
                onSelectMode={setDeliveryMode}
                deliveryAddress={deliveryAddress}
                onAddressChange={setDeliveryAddress}
              />
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                onSelectMethod={setPaymentMethod}
                cardDetails={cardDetails}
                onCardDetailsChange={handleCardDetailsChange}
              />
            </div>
          </div>

          {/* Right Column: Order Review & Place Order Button */}
          <div>
            <div
              style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                position: 'sticky',
                top: '20px',
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                Order Summary
              </h3>

              {/* Items Snapshot */}
              <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                {items.map((it) => (
                  <div key={it.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                    <div style={{ maxWidth: '170px' }}>
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>{it.variantName}</span>
                      <span style={{ color: '#64748b' }}> x {it.quantity}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>${it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: '500', color: '#0f172a' }}>${cart.total.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
                <span>Delivery</span>
                <span style={{ fontWeight: '500', color: '#15803d' }}>
                  {deliveryMode === 'STORE_PICKUP' ? 'Free (Pickup)' : 'Free (Standard)'}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Total Due</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb' }}>
                  ${cart.total.toFixed(2)}
                </span>
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
                {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}
              </button>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                Protected by sp_PlaceOrder ACID Transaction
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
