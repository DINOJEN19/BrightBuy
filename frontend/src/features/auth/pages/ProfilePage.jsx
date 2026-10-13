import React, { useState } from 'react';
import client from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await client.put('/customers/me', Object.fromEntries(new FormData(e.currentTarget)));
      setUser(res.data.data);
      setMessage('Your profile has been saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const formatRole = (r) => {
    if (r === 'ADMIN') return 'Administrator';
    if (r === 'WAREHOUSE_STAFF') return 'Inventory Operations';
    return 'Customer Account';
  };

  return (
    <section className="auth-card panel">
      <h1>Your profile</h1>
      <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
        {user.email}
        <span style={{ display: 'inline-block', marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', backgroundColor: '#e2ebd7', color: '#16352e' }}>
          {formatRole(user.role)}
        </span>
      </p>
      {message && <p role="status" className="success">{message}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      <form onSubmit={save}>
        {[
          ['fullName', 'Full name', 100],
          ['phone', 'Phone', 20],
          ['address', 'Address', 255],
          ['city', 'City', 80],
        ].map(([name, label, max]) => (
          <label key={name}>
            {label}
            <input name={name} defaultValue={user[name]} required maxLength={max} />
          </label>
        ))}
        <button className="primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </section>
  );
}
