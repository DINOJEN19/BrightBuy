// frontend/src/features/auth/api.js
// Client API layer for authentication and customer profile endpoints.

import client from '../../api/client';

/**
 * Log in with email and password.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ data: { token: string, expiresIn: string, customer: object } }>}
 */
export const login = (credentials) => client.post('/auth/login', credentials);

/**
 * Register a new customer account.
 * @param {{ fullName: string, email: string, password: string, phone?: string, address?: string, city?: string }} data
 * @returns {Promise<{ data: { customerId: number, email: string } }>}
 */
export const register = (data) => client.post('/auth/register', data);

/**
 * Invalidate session (logout).
 * @returns {Promise<void>}
 */
export const logout = () => client.post('/auth/logout');

/**
 * Fetch the logged-in customer's profile.
 * @returns {Promise<{ data: { customerId: number, fullName: string, email: string, phone: string, address: string, city: string, role: string } }>}
 */
export const getProfile = () => client.get('/customers/me');

/**
 * Update the logged-in customer's profile.
 * @param {{ fullName?: string, phone?: string, address?: string, city?: string }} updates
 * @returns {Promise<{ data: object }>}
 */
export const updateProfile = (updates) => client.put('/customers/me', updates);

export default {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
};
