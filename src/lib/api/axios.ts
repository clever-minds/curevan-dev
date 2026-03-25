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

export default api;