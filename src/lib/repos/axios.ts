"use client";

import axios from "axios";
import { getToken } from "@/lib/auth";

const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Make the interceptor async
clientApi.interceptors.request.use(async (config) => {
  const token = await getToken(); // ✅ now resolved before use
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default clientApi;