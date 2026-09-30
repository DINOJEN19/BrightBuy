// services/customers.service.js
// Business logic for reading and updating the logged-in customer's own profile.

'use strict';

const pool = require('../config/db');

/**
 * Get a customer's profile by their ID.
 * @param {number} customerId
 * @returns {{ customerId, fullName, email, phone, address, city }}
 */
async function getProfile(customerId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT customer_id, full_name, email, phone, address, city
       FROM CUSTOMER
       WHERE customer_id = ?`,
      [customerId]
    );

    if (rows.length === 0) return null;

    const c = rows[0];
    return {
      customerId: c.customer_id,
      fullName: c.full_name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
    };
  } finally {
    conn.release();
  }
}

/**
 * Update mutable profile fields for a customer.
 * Only fields provided in `updates` are changed (partial update).
 * @param {number} customerId
 * @param {{ fullName?, phone?, address?, city? }} updates
 * @returns {{ customerId, fullName, email, phone, address, city }}
 */
async function updateProfile(customerId, updates) {
  const fieldMap = {
    fullName: 'full_name',
    phone: 'phone',
    address: 'address',
    city: 'city',
  };

  const setClauses = [];
  const values = [];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      values.push(updates[key]);
    }
  }

  if (setClauses.length === 0) {
    // Nothing to update — just return the current profile
    return getProfile(customerId);
  }

  values.push(customerId);

  const conn = await pool.getConnection();
  try {
    await conn.query(
      `UPDATE CUSTOMER SET ${setClauses.join(', ')} WHERE customer_id = ?`,
      values
    );
    return getProfile(customerId);
  } finally {
    conn.release();
  }
}

module.exports = { getProfile, updateProfile };
