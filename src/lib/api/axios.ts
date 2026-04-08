// src/lib/api/axios.ts
import axios from 'axios';
import { getCookie } from '@/lib/utils';
const API = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API,
  withCredentials: true, 
});

api.interceptors.request.use(
  (config) => {
    const token = getCookie('token');
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