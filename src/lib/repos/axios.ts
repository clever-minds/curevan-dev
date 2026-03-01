"use client";

import axios from "axios";
import { getToken } from "@/lib/auth";

const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

clientApi.interceptors.request.use((config) => {
  const token = getToken(); // ✅ client only
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default clientApi;
