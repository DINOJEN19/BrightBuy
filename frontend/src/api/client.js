import axios from 'axios';
const client = axios.create({baseURL: import.meta.env.VITE_API_URL || '/api/v1', timeout:15000});
client.interceptors.request.use(config => {
  const token = sessionStorage.getItem('brightbuy.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use(response => response, error => {
  const apiError = error.response?.data?.error;
  if (apiError) { error.message = apiError.message; error.code = apiError.code; }
  else if (!error.response) error.message = 'Cannot reach BrightBuy. Check that the API and database are running.';
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
    sessionStorage.removeItem('brightbuy.token');
    window.dispatchEvent(new Event('brightbuy:signout'));
  }
  return Promise.reject(error);
});
export default client;
