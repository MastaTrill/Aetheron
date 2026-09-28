import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const ApiContext = createContext();

const API_BASE_URL =
  process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('aetheron_token');

const redirectToLogin = () => {
  localStorage.removeItem('aetheron_token');
  window.location.href = '/login';
};

const getErrorMessage = (payload, fallback) => payload?.error || payload?.message || fallback;

const request = async (path, { method = 'GET', body, timeout = 10000 } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (response.status === 401) {
      redirectToLogin();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, 'Request failed'));
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await request('/auth/login', {
        method: 'POST',
        body: { username, password }
      });
      const { token } = response;
      localStorage.setItem('aetheron_token', token);
      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await request('/stats');
    } catch (err) {
      setError(err.message || 'Failed to fetch stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBlockchainData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await request('/multichain/chains');
    } catch (err) {
      setError(err.message || 'Failed to fetch blockchain data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await request('/users');
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLogs = useCallback(async (limit = 100) => {
    setLoading(true);
    setError(null);
    try {
      return await request(`/logs?limit=${limit}`);
    } catch (err) {
      setError(err.message || 'Failed to fetch logs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getHealth = useCallback(async () => request('/health'), []);

  const value = {
    loading,
    error,
    login,
    getStats,
    getBlockchainData,
    getUsers,
    getLogs,
    getHealth,
    clearError: () => setError(null)
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

ApiProvider.propTypes = {
  children: PropTypes.node.isRequired
};
