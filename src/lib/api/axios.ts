// src/lib/api/axios.ts
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ cookie automatically bhej dega
});

/* 🔐 Interceptor optional, token remove kar diya */
api.interceptors.request.use(
  (config) => {
    // const token = getToken(); // ❌ hata diya
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;