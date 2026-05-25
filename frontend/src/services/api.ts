import axios from 'axios';
import type {
  LoginRequest,
  AuthResponse,
  RegisterRequest,
  RouteRequest,
  RouteResponse,
  RouteHistory,
  SessionsResponse,
  SystemLog,
  CityMetrics,
} from '@/types';

// ============================================================
// Verdex API Service — typed wrapper around the FastAPI backend
// ============================================================

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('verdex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---- Auth ----

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/api/auth/login', data);
  return res.data;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/api/auth/register', data);
  return res.data;
};

// ---- Routes ----

export const optimizeRoute = async (data: RouteRequest): Promise<RouteResponse> => {
  const res = await api.post<RouteResponse>('/api/routes/optimize', data);
  return res.data;
};

export const getRouteHistory = async (userId: string): Promise<RouteHistory[]> => {
  const res = await api.get<RouteHistory[]>(`/api/routes/history/${userId}`);
  return res.data;
};

// ---- Admin ----

export const getSessions = async (): Promise<SessionsResponse> => {
  const res = await api.get<SessionsResponse>('/api/admin/sessions');
  return res.data;
};

export const getSystemLogs = async (): Promise<SystemLog[]> => {
  const res = await api.get<SystemLog[]>('/api/admin/logs');
  return res.data;
};

// ---- Client / City Planner ----

export const getCityMetrics = async (): Promise<CityMetrics> => {
  const res = await api.get<CityMetrics>('/api/client/metrics');
  return res.data;
};

export default api;
