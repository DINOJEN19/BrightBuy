// services/auth.service.js
// Business logic for registration and login.
// Password hashing (bcrypt, cost 10) lives ONLY here — never in a controller.

'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const BCRYPT_ROUNDS = 10;

/**
 * Register a new customer.
 * @param {{ fullName, email, password, phone, address, city }} data
 * @returns {{ customerId, email }}
 * @throws 409 EMAIL_TAKEN if the email already exists.
 */
async function register(data) {
  const { fullName, email, password, phone, address, city } = data;

  // Hash the password before storing (REQ-5.3)
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const conn = await pool.getConnection();
  try {
    // Check for duplicate email before attempting the insert
    const [existing] = await conn.query(
      'SELECT customer_id FROM CUSTOMER WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      const err = new Error('An account with this email already exists.');
      err.status = 409;
      err.code = 'EMAIL_TAKEN';
      throw err;
    }

    const [result] = await conn.query(
      `INSERT INTO CUSTOMER (full_name, email, password_hash, phone, address, city)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, phone, address, city]
    );

    return { customerId: result.insertId, email };
  } finally {
    conn.release();
  }
}

/**
 * Authenticate a customer with email + password, return a signed JWT.
 * @param {{ email, password }} credentials
 * @returns {{ token, expiresIn, customer }}
 * @throws 401 INVALID_CREDENTIALS on bad email/password.
 */
async function login({ email, password }) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT customer_id, full_name, email, password_hash, phone, address, city, role
       FROM CUSTOMER
       WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      const err = new Error('Email or password is incorrect.');
      err.status = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const customer = rows[0];
    const passwordMatch = await bcrypt.compare(password, customer.password_hash);

    if (!passwordMatch) {
      const err = new Error('Email or password is incorrect.');
      err.status = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const payload = {
      customerId: customer.customer_id,
      role: customer.role || 'CUSTOMER',
    };

    const expiresIn = process.env.JWT_EXPIRES_IN || '2h';
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    return {
      token,
      expiresIn,
      customer: {
        customerId: customer.customer_id,
        fullName: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        role: customer.role || 'CUSTOMER',
      },
    };
  } finally {
    conn.release();
  }
}

module.exports = { register, login };
