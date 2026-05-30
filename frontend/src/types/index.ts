// ============================================================
// Verdex — Shared TypeScript Interfaces
// All API data contracts live here and are imported across components.
// ============================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  user_id: string;
  origin: Coordinates;
  destination: Coordinates;
  preferences: {
    max_walk_time_mins: number;
  };
  route_type?: 'eco' | 'alternative';
  persist?: boolean;
}

export interface BestRoute {
  mode: string;
  total_time_mins: number;
  co2_saved_kg: number;
  path_coordinates: [number, number][];
}

export interface RouteDetails extends BestRoute {
  distance_km: number;
  carbon_credits_earned: number;
}

export interface RouteResponse {
  status: 'success' | 'error';
  eco_route?: RouteDetails;
  alt_route?: RouteDetails;
  best_route?: RouteDetails;
  carbon_credits_earned: number;
}

// ---- Auth Types ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'client' | 'admin';
}

export interface AuthResponse {
  token?: string;
  user_id?: string;
  role: string;
  name: string;
  status?: string;
  message?: string;
}

export interface UserInfo {
  user_id: string;
  name: string;
  email: string;
  role: 'user' | 'client' | 'admin';
}

// ---- Dashboard Types ----

export interface SessionInfo {
  session_id: string;
  user_id: string;
  last_active: string;
  is_active: boolean;
}

export interface SessionsResponse {
  active_sessions: number;
  max_sessions: number;
  sessions: SessionInfo[];
}

export interface SystemLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
}

export interface MonthlyTrend {
  month: string;
  co2_saved: number;
}

export interface ModeStats {
  mode: string;
  count: number;
  percentage: number;
}

export interface CityMetrics {
  total_co2_saved_kg: number;
  total_routes_optimized: number;
  active_users: number;
  monthly_trend: MonthlyTrend[];
  top_modes: ModeStats[];
}

export interface RouteHistory {
  route_id: string;
  source_coords: Coordinates;
  dest_coords: Coordinates;
  mode: string;
  total_time_mins: number;
  co2_saved_kg: number;
  created_at: string;
}

export interface TripReportSummary {
  total_co2_saved_kg: number;
  total_trips: number;
  total_time_hours: number;
  carbon_credits_earned: number;
  trees_equivalent: number;
  cars_removed: number;
  mode_breakdown: Record<string, number>;
}

export interface TripReportResponse {
  status: string;
  trips: RouteHistory[];
  summary: TripReportSummary;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  email: string;
  role: string;
  total_co2_saved_kg: number;
  carbon_credits_earned: number;
}

export interface CongestionSummary {
  total_flags: number;
  peak_day: string;
  worst_hour: string;
  am_count: number;
  pm_count: number;
  am_ratio: number;
  pm_ratio: number;
}

export interface CongestionBarData {
  labels: string[];
  am_data: number[];
  pm_data: number[];
}

export interface CongestionLineData {
  labels: string[];
  data: number[];
}

export interface CongestionReportResponse {
  status: string;
  summary: CongestionSummary;
  bar_chart: CongestionBarData;
  line_chart: CongestionLineData;
  corridors: string[];
}

export interface PendingPlannerRequest {
  request_id: string;
  name: string;
  email: string;
  created_at: string;
}


