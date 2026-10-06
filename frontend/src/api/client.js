import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
});

let inMemoryToken = null;
let authPromise = null;

const getStorageItem = (key) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return inMemoryToken;
};

const setStorageItem = (key, value) => {
  if (key === 'brightbuy_token') inMemoryToken = value;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

const removeStorageItem = (key) => {
  if (key === 'brightbuy_token') inMemoryToken = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  }
};

/**
 * Ensures a valid customer JWT token is available.
 * If missing or expired, automatically logs in as the demo customer (David Martinez).
 */
export async function ensureToken() {
  const token = getStorageItem('brightbuy_token');
  if (token) return token;

  if (!authPromise) {
    authPromise = client.post('/auth/login', {
      email: 'david.martinez@example.com',
      password: 'password123',
    }).then(res => {
      const newToken = res.data?.data?.token;
      if (newToken) {
        setStorageItem('brightbuy_token', newToken);
        setStorageItem('brightbuy_role', res.data.data.customer?.role || 'CUSTOMER');
        setStorageItem('brightbuy_user', JSON.stringify(res.data.data.customer));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-change'));
        }
        return newToken;
      }
    }).catch(err => {
      console.warn('Auto-login could not complete:', err.message);
      return null;
    }).finally(() => {
      authPromise = null;
    });
  }

  return authPromise;
}

// Request interceptor: attach token (fetching one automatically if not yet stored)
client.interceptors.request.use(async (config) => {
  // Never attempt auto-login recursion on auth endpoints
  if (config.url && config.url.includes('/auth/')) {
    return config;
  }

  let token = getStorageItem('brightbuy_token');
  if (!token) {
    token = await ensureToken();
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 Unauthorized, automatically re-authenticate and retry
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    // Do not retry auth endpoint failures
    if (originalRequest?.url && originalRequest.url.includes('/auth/')) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      removeStorageItem('brightbuy_token');
      const token = await ensureToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return client(originalRequest);
      }
    }
    return Promise.reject(err);
  }
);

export default client;
