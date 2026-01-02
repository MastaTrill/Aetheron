import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const ApiContext = createContext();

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

  // Create axios instance with base configuration
  const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor for auth
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('aetheron_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('aetheron_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  // API methods
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token } = response.data;
      localStorage.setItem('aetheron_token', token);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getBlockchainData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/multichain/chains');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch blockchain data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getLogs = useCallback(async (limit = 100) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/logs?limit=${limit}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch logs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getHealth = useCallback(async () => {
    const response = await axios.get('/health');
    return response.data;
  }, []);

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

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};