import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
});

let inMemoryToken = null;

export const DEMO_ACCOUNTS = {
  ADMIN: {
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN',
    name: 'Admin User',
  },
  CUSTOMER: {
    email: 'david.martinez@example.com',
    password: 'password123',
    role: 'CUSTOMER',
    name: 'David Martinez',
  },
  STAFF: {
    email: 'staff@example.com',
    password: 'password123',
    role: 'WAREHOUSE_STAFF',
    name: 'Warehouse Staff',
  },
};

export const getStorageItem = (key) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return inMemoryToken;
};

export const setStorageItem = (key, value) => {
  if (key === 'brightbuy_token') inMemoryToken = value;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

export const removeStorageItem = (key) => {
  if (key === 'brightbuy_token') inMemoryToken = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  }
};

/**
 * Extracts the user role from a JWT token without verifying signature.
 */
export function getRoleFromToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload).role || null;
  } catch {
    return null;
  }
}

/**
 * Switches the active session and token to the target role (ADMIN, CUSTOMER, or STAFF).
 */
export async function switchRole(targetRole = 'CUSTOMER') {
  const creds = DEMO_ACCOUNTS[targetRole] || DEMO_ACCOUNTS.CUSTOMER;
  const res = await client.post('/auth/login', {
    email: creds.email,
    password: creds.password,
  });
  const newToken = res.data?.data?.token;
  if (newToken) {
    setStorageItem('brightbuy_token', newToken);
    setStorageItem('brightbuy_role', res.data.data.customer?.role || targetRole);
    setStorageItem('brightbuy_user', JSON.stringify(res.data.data.customer));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'));
    }
    return newToken;
  }
  return null;
}

/**
 * Ensures a valid JWT token is available for demo/quick role switching.
 */
export async function ensureToken(preferredRole) {
  const token = getStorageItem('brightbuy_token');
  const tokenRole = getRoleFromToken(token);

  if (token) {
    if (!preferredRole || tokenRole === preferredRole) {
      return token;
    }
  }

  // If a specific preferredRole was explicitly requested, log in as that demo account
  if (preferredRole) {
    return switchRole(preferredRole);
  }

  return token;
}

// Request interceptor: attach token if present
client.interceptors.request.use((config) => {
  const token = getStorageItem('brightbuy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 Unauthorized, clean up expired token
client.interceptors.response.use(
  (res) => res,
  (err) => {
    // If receiving 401 on a non-auth endpoint, session expired
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      removeStorageItem('brightbuy_token');
      removeStorageItem('brightbuy_role');
      removeStorageItem('brightbuy_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
      }
    }
    return Promise.reject(err);
  }
);

export default client;
