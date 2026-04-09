// src/lib/api/axios.ts
import axios from 'axios';
import { getCookie } from '@/lib/utils';
const API = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API,
  withCredentials: true, 
  timeout: 10000, // 10 seconds timeout
});

api.interceptors.request.use(
  (config) => {
    let token = getCookie('token');
    
    // Fallback to localStorage for IP-based access or non-cookie environments
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      return Promise.reject({
        message: response.data.message || response.data.error || "Operation failed",
        ...response.data
      });
    }
    return response;
  },
  (error) => {
    const backendData = error.response?.data;
    if (backendData) {
      return Promise.reject({
        message: backendData.message || backendData.error || error.message,
        ...backendData
      });
    }
    return Promise.reject(error);
  }
);

export default api;