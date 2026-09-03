// api.js - Centralized API Service with Automatic JWT Header Injection
const API_BASE_URL = '/api';

// Token and User persistence in localStorage
export const getStoredToken = () => localStorage.getItem('token');
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Generic API request wrapper using native fetch
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication API methods
export const authApi = {
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  getMe: () => apiRequest('/auth/me', { method: 'GET' })
};

// Job Applications API methods
export const applicationApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.status && params.status !== 'All') {
      query.append('status', params.status);
    }
    const queryString = query.toString();
    return apiRequest(`/applications${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  getById: (id) => apiRequest(`/applications/${id}`, { method: 'GET' }),
  create: (appData) => apiRequest('/applications', { method: 'POST', body: appData }),
  update: (id, appData) => apiRequest(`/applications/${id}`, { method: 'PUT', body: appData }),
  delete: (id) => apiRequest(`/applications/${id}`, { method: 'DELETE' })
};
