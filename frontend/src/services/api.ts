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
  TripReportResponse,
  UserInfo,
  LeaderboardEntry,
  CongestionReportResponse,
  PendingPlannerRequest,
} from '@/types';

// ============================================================
// Verdex API Service — typed wrapper around the FastAPI backend
// ============================================================

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10-second timeout to prevent hanging forever
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

export const getCityMetrics = async (city?: string): Promise<CityMetrics> => {
  const res = await api.get<CityMetrics>('/api/client/metrics', {
    params: city ? { city } : {},
  });
  return res.data;
};

export const getTripReport = async (userId: string): Promise<TripReportResponse> => {
  const res = await api.get<TripReportResponse>(`/api/routes/report/${userId}`);
  return res.data;
};

export const adminGetUsers = async (): Promise<UserInfo[]> => {
  const res = await api.get<UserInfo[]>('/api/auth/admin/users');
  return res.data;
};

export const adminDeleteUser = async (userId: string): Promise<{ status: string; message: string }> => {
  const res = await api.delete<{ status: string; message: string }>(`/api/auth/admin/users/${userId}`);
  return res.data;
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const res = await api.get<LeaderboardEntry[]>('/api/routes/leaderboard');
  return res.data;
};

export const getPendingPlanners = async (): Promise<PendingPlannerRequest[]> => {
  const res = await api.get<PendingPlannerRequest[]>('/api/auth/admin/approvals');
  return res.data;
};

export const approvePlanner = async (requestId: string): Promise<{ status: string; message: string }> => {
  const res = await api.post<{ status: string; message: string }>(`/api/auth/admin/approvals/${requestId}/approve`);
  return res.data;
};

export const rejectPlanner = async (requestId: string): Promise<{ status: string; message: string }> => {
  const res = await api.post<{ status: string; message: string }>(`/api/auth/admin/approvals/${requestId}/reject`);
  return res.data;
};

export const getCongestionReport = async (
  city?: string,
  weekStart?: string,
  corridor?: string
): Promise<CongestionReportResponse> => {
  const params: Record<string, string> = {};
  if (city) params.city = city;
  if (weekStart) params.week_start = weekStart;
  if (corridor) params.corridor = corridor;
  const res = await api.get<CongestionReportResponse>('/api/client/congestion-report', { params });
  return res.data;
};

export default api;
