import os
import uuid
import re
import time
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import requests as http_requests

from fastapi import APIRouter, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from app.agent.engine import optimize_route
from app.database import supabase_client

router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class Coordinates(BaseModel):
    lat: float
    lng: float


class Preferences(BaseModel):
    max_walk_time_mins: Optional[int] = None


class RouteRequest(BaseModel):
    user_id: str
    origin: Coordinates
    destination: Coordinates
    preferences: Optional[Preferences] = None
    route_type: Optional[str] = "eco"
    persist: Optional[bool] = False
    selected_mode: Optional[str] = None
    points_earned: Optional[int] = None
    traffic_severity: Optional[str] = "LOW"


class RouteDetails(BaseModel):
    mode: str
    total_time_mins: int
    co2_saved_kg: float
    path_coordinates: list[list[float]]
    distance_km: float
    carbon_credits_earned: float


class RouteResponse(BaseModel):
    status: str
    eco_route: Optional[RouteDetails] = None
    alt_route: Optional[RouteDetails] = None
    best_route: Optional[RouteDetails] = None
    carbon_credits_earned: float


class RouteAnalysisRequest(BaseModel):
    origin: str
    destination: str
    distance: float
    rep_coord: dict[str, float]
    waypoints: Optional[list[list[float]]] = None
    weather: dict[str, Any]
    traffic: dict[str, Any]
    air_quality: dict[str, Any]
    disasters: dict[str, Any]


# ---------------------------------------------------------------------------
# In-Memory Mock Data Stores
# ---------------------------------------------------------------------------

DEMO_USER_ID: str = "demo-user-00000000-0000-0000-0000-000000000001"

_now = datetime.now(timezone.utc)

routes_history: list[dict[str, Any]] = [
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 31.5204, "lng": 74.3587},
        "dest_coords": {"lat": 31.5497, "lng": 74.3436},
        "mode": "metro + walking",
        "total_time_mins": 22,
        "co2_saved_kg": 0.85,
        "created_at": (_now - timedelta(days=1)).isoformat(),
    },
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 31.4697, "lng": 74.2728},
        "dest_coords": {"lat": 31.5204, "lng": 74.3587},
        "mode": "bus + metro",
        "total_time_mins": 45,
        "co2_saved_kg": 1.52,
        "created_at": (_now - timedelta(days=2)).isoformat(),
    },
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 31.5204, "lng": 74.3587},
        "dest_coords": {"lat": 31.5126, "lng": 74.3468},
        "mode": "bike",
        "total_time_mins": 12,
        "co2_saved_kg": 0.35,
        "created_at": (_now - timedelta(days=3)).isoformat(),
    },
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 31.5820, "lng": 74.3294},
        "dest_coords": {"lat": 31.5204, "lng": 74.3587},
        "mode": "metro + walking",
        "total_time_mins": 30,
        "co2_saved_kg": 1.10,
        "created_at": (_now - timedelta(days=5)).isoformat(),
    },
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 31.5204, "lng": 74.3587},
        "dest_coords": {"lat": 31.5300, "lng": 74.3530},
        "mode": "walking",
        "total_time_mins": 15,
        "co2_saved_kg": 0.25,
        "created_at": (_now - timedelta(days=7)).isoformat(),
    },
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 24.8607, "lng": 67.0011},
        "dest_coords": {"lat": 24.8922, "lng": 67.0253},
        "mode": "bus + metro",
        "total_time_mins": 38,
        "co2_saved_kg": 2.10,
        "created_at": (_now - timedelta(days=1)).isoformat(),
    },
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 24.9180, "lng": 67.0910},
        "dest_coords": {"lat": 24.8990, "lng": 67.0750},
        "mode": "bike",
        "total_time_mins": 14,
        "co2_saved_kg": 0.65,
        "created_at": (_now - timedelta(days=4)).isoformat(),
    },
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 33.6844, "lng": 73.0479},
        "dest_coords": {"lat": 33.7122, "lng": 73.0781},
        "mode": "metro + walking",
        "total_time_mins": 25,
        "co2_saved_kg": 1.45,
        "created_at": (_now - timedelta(days=2)).isoformat(),
    },
    {
        "route_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "source_coords": {"lat": 33.7294, "lng": 73.0931},
        "dest_coords": {"lat": 33.7194, "lng": 73.0831},
        "mode": "walking",
        "total_time_mins": 18,
        "co2_saved_kg": 0.30,
        "created_at": (_now - timedelta(days=6)).isoformat(),
    },
]

def generate_mock_hazard_events() -> list[dict[str, Any]]:
    import random
    from datetime import datetime, timedelta, timezone
    
    events = []
    cities = ["Lahore", "Karachi", "Islamabad"]
    corridors = {
        "Lahore": ["Gulberg - Mall Road", "Johar Town - DHA", "Ferozepur Road - Anarkali", "Model Town - Barkat Market"],
        "Karachi": ["Clifton - DHA Phase 6", "Saddar - Gulshan-e-Iqbal", "Korangi - Clifton", "I.I. Chundrigar - North Nazimabad"],
        "Islamabad": ["Blue Area - F-10", "I-8 - Centaurus", "G-11 - Secretariat", "Saddar Rawalpindi - Blue Area"]
    }
    severities = ["severe", "moderate", "low"]
    
    # Current week's Monday
    now = datetime.now(timezone.utc)
    start_of_this_week = now - timedelta(days=now.weekday())
    start_of_this_week = datetime(start_of_this_week.year, start_of_this_week.month, start_of_this_week.day, tzinfo=timezone.utc)
    
    for _ in range(150):
        city = random.choice(cities)
        corridor = random.choice(corridors[city])
        week_offset = random.choice([0, -1, -2])
        day_offset = random.randint(0, 6)
        
        # Focus on rush hours: 8-10 AM (hour 8, 9) and 5-8 PM (hour 17, 18, 19)
        if random.random() < 0.60:
            hour = random.choice([8, 9, 17, 18, 19])
        else:
            hour = random.randint(0, 23)
            
        severity = random.choices(severities, weights=[0.70, 0.20, 0.10], k=1)[0]
        route_type = random.choices(["eco", "alternative"], weights=[0.80, 0.20], k=1)[0]
        
        event_time = start_of_this_week + timedelta(weeks=week_offset, days=day_offset, hours=hour, minutes=random.randint(0, 59))
        event_day = event_time.strftime("%A")
        event_hour = event_time.hour
        
        events.append({
            "event_id": str(uuid.uuid4()),
            "route_id": str(uuid.uuid4()),
            "route_type": route_type,
            "city": city,
            "severity": severity,
            "day_of_week": event_day,
            "hour_of_day": event_hour,
            "corridor": corridor,
            "created_at": event_time.isoformat()
        })
    return events


hazard_events_history = generate_mock_hazard_events()


def log_hazard_event_local(
    route_type: str,
    city: str,
    severity: str,
    day_of_week: str,
    hour_of_day: int,
    corridor: str
) -> dict[str, Any]:
    db_res = supabase_client.log_hazard_event(
        route_type=route_type,
        city=city,
        severity=severity,
        day_of_week=day_of_week,
        hour_of_day=hour_of_day,
        corridor=corridor
    )
    event_entry = {
        "event_id": db_res.get("event_id") if db_res else str(uuid.uuid4()),
        "route_id": str(uuid.uuid4()),
        "route_type": route_type,
        "city": city,
        "severity": severity,
        "day_of_week": day_of_week,
        "hour_of_day": hour_of_day,
        "corridor": corridor,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    hazard_events_history.append(event_entry)
    return event_entry


carbon_records: list[dict[str, Any]] = [
    {
        "record_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "route_id": routes_history[0]["route_id"],
        "co2_saved": 0.85,
        "created_at": (_now - timedelta(days=1)).isoformat(),
    },
    {
        "record_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "route_id": routes_history[1]["route_id"],
        "co2_saved": 1.52,
        "created_at": (_now - timedelta(days=2)).isoformat(),
    },
    {
        "record_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "route_id": routes_history[2]["route_id"],
        "co2_saved": 0.35,
        "created_at": (_now - timedelta(days=3)).isoformat(),
    },
]

sessions: list[dict[str, Any]] = [
    {
        "session_id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "last_active": _now.isoformat(),
        "is_active": True,
    },
    {
        "session_id": str(uuid.uuid4()),
        "user_id": "demo-user-00000000-0000-0000-0000-000000000002",
        "last_active": (_now - timedelta(minutes=3)).isoformat(),
        "is_active": True,
    },
]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/routes/optimize", response_model=RouteResponse)
async def optimize(body: RouteRequest) -> RouteResponse:
    """Accept a route request, run the agent engine, and return the result."""
    # Pakistan bounding box validation (longitude 60.87°E–77.84°E, latitude 23.63°N–37.09°N)
    for pt in [body.origin, body.destination]:
        if not (23.63 <= pt.lat <= 37.09 and 60.87 <= pt.lng <= 77.84):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Origin and destination coordinates must be within Pakistan boundary."
            )

    result = optimize_route(
        origin={"lat": body.origin.lat, "lng": body.origin.lng},
        destination={"lat": body.destination.lat, "lng": body.destination.lng},
        preferences=body.preferences.model_dump() if body.preferences else {},
    )

    eco_route_data = result["eco_route"]
    alt_route_data = result["alt_route"]

    # Save to history if persist is True
    if body.persist:
        chosen_route = eco_route_data if body.route_type == "eco" else alt_route_data
        
        final_mode = body.selected_mode if body.selected_mode else chosen_route["mode"]
        if body.points_earned is not None:
            final_co2 = body.points_earned * 0.5
        else:
            final_co2 = chosen_route["co2_saved_kg"]
        
        # Calculate travel time dynamically based on the selected mode & traffic severity
        if body.selected_mode:
            distance_km = chosen_route["distance_km"]
            mode_lower = body.selected_mode.lower()
            traffic_sev = (body.traffic_severity or "LOW").upper()
            
            if "car" in mode_lower:
                base_speed = 45.0
                if traffic_sev == "SEVERE":
                    speed = base_speed * 0.3  # 13.5 km/h (severe traffic congestion)
                elif traffic_sev == "MODERATE":
                    speed = base_speed * 0.6  # 27.0 km/h (moderate traffic)
                else:
                    speed = base_speed  # 45.0 km/h (free-flowing)
            elif "bike" in mode_lower:
                base_speed = 52.0
                if traffic_sev == "SEVERE":
                    speed = base_speed * 0.7  # 36.4 km/h (motorbike weaving through traffic)
                elif traffic_sev == "MODERATE":
                    speed = base_speed * 0.85  # 44.2 km/h
                else:
                    speed = base_speed  # 52.0 km/h
            elif "public" in mode_lower or "bus" in mode_lower or "metro" in mode_lower:
                base_speed = 35.0 if distance_km < 15 else 30.0
                if traffic_sev == "SEVERE":
                    speed = base_speed * 0.6  # 18.0 - 21.0 km/h (bus delayed, metro unaffected)
                elif traffic_sev == "MODERATE":
                    speed = base_speed * 0.8  # 24.0 - 28.0 km/h
                else:
                    speed = base_speed
            elif "walk" in mode_lower:
                speed = 5.0
            else:
                speed = 15.0
            
            final_time = max(1, round((distance_km / speed) * 60.0))
        else:
            final_time = chosen_route["total_time_mins"]
        
        # Persist to live Supabase if active
        new_route = supabase_client.create_route(
            user_id=body.user_id,
            source_coords={"lat": body.origin.lat, "lng": body.origin.lng},
            dest_coords={"lat": body.destination.lat, "lng": body.destination.lng},
            mode=final_mode,
            total_time_mins=final_time,
            co2_saved_kg=final_co2
        )
        
        if new_route:
            route_id = new_route["route_id"]
            if final_co2 > 0:
                supabase_client.create_carbon_record(
                    user_id=body.user_id,
                    route_id=route_id,
                    co2_saved=final_co2
                )
        else:
            # Fallback to local in-memory stores
            route_entry: dict[str, Any] = {
                "route_id": str(uuid.uuid4()),
                "user_id": body.user_id,
                "source_coords": {"lat": body.origin.lat, "lng": body.origin.lng},
                "dest_coords": {"lat": body.destination.lat, "lng": body.destination.lng},
                "mode": final_mode,
                "total_time_mins": final_time,
                "co2_saved_kg": final_co2,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            routes_history.append(route_entry)

            if final_co2 > 0:
                carbon_records.append(
                    {
                        "record_id": str(uuid.uuid4()),
                        "user_id": body.user_id,
                        "route_id": route_entry["route_id"],
                        "co2_saved": final_co2,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }
                )

    # Return RouteResponse containing both routes, setting eco as default best_route fallback
    return RouteResponse(
        status="success",
        eco_route=RouteDetails(**eco_route_data),
        alt_route=RouteDetails(**alt_route_data),
        best_route=RouteDetails(**eco_route_data),
        carbon_credits_earned=eco_route_data["carbon_credits_earned"]
    )


@router.get("/routes/history/{user_id}", response_model=list[dict[str, Any]])
async def route_history(user_id: str) -> list[dict[str, Any]]:
    """Return route history for the given user."""
    # Try Supabase first
    history = supabase_client.get_route_history(user_id)
    if history is not None:
        return history
        
    # Fallback to mock history
    user_routes = [r for r in routes_history if r["user_id"] == user_id]
    return user_routes


@router.get("/routes/report/{user_id}")
async def get_route_report(user_id: str):
    """Generate aggregate statistics and list routes for the user report."""
    # Try Supabase first
    history = supabase_client.get_route_history(user_id)
    if history is None:
        history = [r for r in routes_history if r["user_id"] == user_id]

    total_co2_saved_kg = sum(r.get("co2_saved_kg", 0.0) for r in history)
    total_trips = len(history)
    total_time_hours = sum(r.get("total_time_mins", 0) for r in history) / 60.0

    # compute carbon credits at 1 credit per 0.5 kg CO2
    carbon_credits_earned = total_co2_saved_kg / 0.5

    # trees equivalent at 21 kg CO2 per tree
    trees_equivalent = total_co2_saved_kg / 21.0

    # cars removed at 4.6 tonnes (4600.0 kg) per car per year
    cars_removed = total_co2_saved_kg / 4600.0

    # compute mode breakdown
    mode_breakdown = {}
    for r in history:
        m = r.get("mode", "unknown")
        mode_breakdown[m] = mode_breakdown.get(m, 0) + 1

    summary = {
        "total_co2_saved_kg": round(total_co2_saved_kg, 2),
        "total_trips": total_trips,
        "total_time_hours": round(total_time_hours, 2),
        "carbon_credits_earned": round(carbon_credits_earned, 2),
        "trees_equivalent": round(trees_equivalent, 2),
        "cars_removed": round(cars_removed, 4),
        "mode_breakdown": mode_breakdown
    }

    return {
        "status": "success",
        "trips": history,
        "summary": summary
    }


@router.get("/routes/leaderboard", response_model=list[dict[str, Any]])
async def get_leaderboard():
    """Calculate and return the carbon credits leaderboard for all users."""
    # 1. Get all users
    users = supabase_client.get_all_users()
    if users is None:
        from app.api.auth import mock_users
        users = list(mock_users.values())
        
    leaderboard = []
    
    # 2. Enforce roles/admins and ensure Adan and Zarak are represented
    has_adan = False
    has_zarak = False
    
    processed_users = []
    for u in users:
        u_copy = dict(u)
        email = u_copy.get("email")
        if email == "adanoneplus@gmail.com":
            u_copy["role"] = "admin"
            has_adan = True
        elif email == "muhd.zarak.kh@gmail.com":
            u_copy["role"] = "admin"
            has_zarak = True
        else:
            if u_copy.get("role") == "admin":
                u_copy["role"] = "user"
        processed_users.append(u_copy)
        
    if not has_adan:
        processed_users.append({
            "user_id": "77777777-7777-7777-7777-777777777771",
            "name": "Adan Hashmi",
            "email": "adanoneplus@gmail.com",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    if not has_zarak:
        processed_users.append({
            "user_id": "77777777-7777-7777-7777-777777777772",
            "name": "Zarak Khan",
            "email": "muhd.zarak.kh@gmail.com",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # 3. For each user, fetch their total co2_saved_kg and calculate credits
    for u in processed_users:
        uid = u.get("user_id")
        
        # Get history
        history = supabase_client.get_route_history(uid)
        if history is None:
            history = [r for r in routes_history if r.get("user_id") == uid]
            
        total_co2 = sum(r.get("co2_saved_kg", 0.0) for r in history)
        credits = total_co2 / 0.5
        
        leaderboard.append({
            "user_id": uid,
            "name": u.get("name") or u.get("email", "").split("@")[0].capitalize(),
            "email": u.get("email"),
            "role": u.get("role"),
            "total_co2_saved_kg": round(total_co2, 2),
            "carbon_credits_earned": round(credits, 2)
        })
        
    # 4. Sort leaderboard: highest credits on top
    leaderboard.sort(key=lambda x: x["carbon_credits_earned"], reverse=True)
    
    return leaderboard


@router.get("/admin/sessions")
async def admin_sessions() -> dict[str, Any]:
    """Return current session data for the admin dashboard."""
    # Try Supabase first
    active_sessions = supabase_client.get_active_sessions()
    if active_sessions is not None:
        return {
            "active_sessions": len(active_sessions),
            "max_sessions": 10,
            "sessions": active_sessions,
        }
        
    # Fallback to mock sessions
    active = [s for s in sessions if s["is_active"]]
    return {
        "active_sessions": len(active),
        "max_sessions": 10,
        "sessions": sessions,
    }


@router.get("/admin/logs", response_model=list[dict[str, Any]])
async def admin_logs() -> list[dict[str, Any]]:
    """Return mock system logs."""
    logs: list[dict[str, Any]] = [
        {
            "timestamp": (_now - timedelta(minutes=5)).isoformat(),
            "level": "info",
            "message": "Route optimization completed for user demo-user-001",
            "source": "agent.engine",
        },
        {
            "timestamp": (_now - timedelta(minutes=12)).isoformat(),
            "level": "info",
            "message": "New session created for planner@verdex.io",
            "source": "api.auth",
        },
        {
            "timestamp": (_now - timedelta(minutes=20)).isoformat(),
            "level": "warning",
            "message": "Open-Meteo API response latency > 2s",
            "source": "agent.weather",
        },
        {
            "timestamp": (_now - timedelta(hours=1)).isoformat(),
            "level": "info",
            "message": "Daily carbon summary generated: 14.3 kg CO2 saved",
            "source": "scheduler.carbon",
        },
        {
            "timestamp": (_now - timedelta(hours=2)).isoformat(),
            "level": "error",
            "message": "LM Arena API rate-limit reached, falling back to cache",
            "source": "agent.llm",
        },
    ]
    return logs


@router.get("/client/metrics")
async def client_metrics(city: Optional[str] = "All") -> dict[str, Any]:
    """Return city-wide metrics filtered by city (Lahore/Karachi/Islamabad/All)."""
    # 1. Fetch all routes
    routes = supabase_client.get_all_routes()
    if routes is None:
        routes = routes_history

    def get_city_for_route(route: dict[str, Any]) -> str:
        coords = route.get("source_coords")
        if not coords:
            return "Unknown"
        if isinstance(coords, str):
            import json
            try:
                coords = json.loads(coords)
            except Exception:
                return "Unknown"
        try:
            lat = float(coords.get("lat"))
            lng = float(coords.get("lng"))
        except (ValueError, TypeError, AttributeError):
            return "Unknown"
            
        if 31.2 <= lat <= 31.8 and 74.0 <= lng <= 74.7:
            return "Lahore"
        elif 24.7 <= lat <= 25.2 and 66.8 <= lng <= 67.5:
            return "Karachi"
        elif 33.5 <= lat <= 33.9 and 72.7 <= lng <= 73.2:
            return "Islamabad"
        return "Unknown"

    # 2. Filter routes
    if city and city.lower() != "all":
        filtered_routes = [r for r in routes if get_city_for_route(r).lower() == city.lower()]
    else:
        filtered_routes = routes

    # 3. Dynamic aggregations
    total_co2 = sum(float(r.get("co2_saved_kg", 0.0)) for r in filtered_routes)
    total_routes = len(filtered_routes)
    active_users = len(set(r.get("user_id") for r in filtered_routes if r.get("user_id")))

    # Mode breakdown
    mode_counts = {}
    for r in filtered_routes:
        m = r.get("mode", "unknown")
        # normalize modes slightly to match layout
        m_display = m.strip().replace(" + ", " + ").capitalize()
        mode_counts[m_display] = mode_counts.get(m_display, 0) + 1

    top_modes = []
    for m, count in mode_counts.items():
        percentage = round((count / total_routes) * 100.0, 1) if total_routes > 0 else 0.0
        top_modes.append({
            "mode": m,
            "count": count,
            "percentage": percentage
        })
    top_modes.sort(key=lambda x: x["count"], reverse=True)

    # Monthly Trend Calculation
    months_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    # Group by month
    current_month_idx = datetime.now(timezone.utc).month - 1
    # Generate last 6 months list
    trend_months = []
    for i in range(current_month_idx - 5, current_month_idx + 1):
        trend_months.append(months_order[i % 12])

    actual_monthly_co2 = {m: 0.0 for m in trend_months}
    for r in filtered_routes:
        created_str = r.get("created_at")
        if not created_str:
            continue
        try:
            dt = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            month_name = dt.strftime("%b")
            if month_name in actual_monthly_co2:
                actual_monthly_co2[month_name] += float(r.get("co2_saved_kg", 0.0))
        except Exception:
            continue

    monthly_trend = []
    for m in trend_months:
        monthly_trend.append({
            "month": m,
            "co2_saved": round(actual_monthly_co2[m], 1)
        })

    return {
        "total_co2_saved_kg": round(total_co2, 2),
        "total_routes_optimized": total_routes,
        "active_users": active_users,
        "monthly_trend": monthly_trend,
        "top_modes": top_modes,
    }


@router.get("/enviro/data")
async def enviro_data(lat: float = 31.5204, lon: float = 74.3587) -> dict[str, Any]:
    """Proxy environmental data from Open-Meteo APIs + simulated traffic."""
    # Bounding box filter removed to allow environmental query globally

    weather: dict[str, Any] = {}

    air_quality: dict[str, Any] = {}

    try:
        w_resp = http_requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
                "timezone": "auto",
            },
            timeout=10,
        )
        if w_resp.status_code == 200:
            weather = w_resp.json().get("current", {})
    except Exception:
        weather = {
            "temperature_2m": 28, "relative_humidity_2m": 62,
            "wind_speed_10m": 14, "precipitation": 0.2,
        }

    try:
        aq_resp = http_requests.get(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "pm2_5,pm10,carbon_monoxide,european_aqi",
                "timezone": "auto",
            },
            timeout=10,
        )
        if aq_resp.status_code == 200:
            air_quality = aq_resp.json().get("current", {})
    except Exception:
        air_quality = {"european_aqi": 45, "pm2_5": 18}

    # Simulated traffic density based on time of day
    hour = datetime.now().hour
    rush = (7 <= hour <= 9) or (17 <= hour <= 19)
    traffic = {
        "density": "high" if rush else "moderate",
        "rush_hour": rush,
        "congestion_index": 0.82 if rush else 0.35,
    }

    return {
        "latitude": lat,
        "longitude": lon,
        "weather": weather,
        "air_quality": air_quality,
        "traffic": traffic,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/traffic/incidents")
async def get_traffic_incidents(bbox: str) -> dict[str, Any]:
    """Proxy traffic incidents from TomTom Traffic incidents API using the configured key."""
    key = os.getenv("TOMTOM_API_KEY")
    if not key:
        return {"error": True, "message": "TomTom API Key not configured on server"}

    url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
    params = {
        "key": key,
        "bbox": bbox,
        "fields": "{id,iconCategory,magnitude,description,causeOfIncident,from,to,lengthInMeters,delayInSeconds,affectedRoads,geometry}",
        "language": "en-GB",
        "zoom": 12
    }
    try:
        resp = http_requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": True, "message": f"TomTom API returned status code {resp.status_code}"}
    except Exception as e:
        return {"error": True, "message": str(e)}


logger = logging.getLogger(__name__)


class GroqAPIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"Groq API Error {status_code}: {message}")


def estimate_tokens(text: str) -> int:
    return len(text) // 4


def split_text_by_tokens(text: str, max_tokens: int) -> list[str]:
    max_chars = max_tokens * 4
    if len(text) <= max_chars:
        return [text]
    
    chunks = []
    lines = text.split('\n')
    current_chunk = []
    current_len = 0
    
    for line in lines:
        line_len = len(line) + 1  # count newline
        if current_len + line_len > max_chars:
            if current_chunk:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
                current_len = 0
            # If a single line is longer than max_chars, split it by words/chars
            if line_len > max_chars:
                words = line.split(' ')
                curr_word_chunk = []
                curr_word_len = 0
                for word in words:
                    word_len = len(word) + 1
                    if curr_word_len + word_len > max_chars:
                        if curr_word_chunk:
                            chunks.append(' '.join(curr_word_chunk))
                            curr_word_chunk = []
                            curr_word_len = 0
                        # If a single word is longer than max_chars, split by character
                        if word_len > max_chars:
                            for i in range(0, len(word), max_chars):
                                chunks.append(word[i:i+max_chars])
                        else:
                            curr_word_chunk.append(word)
                            curr_word_len += word_len
                    else:
                        curr_word_chunk.append(word)
                        curr_word_len += word_len
                if curr_word_chunk:
                    current_chunk = curr_word_chunk
                    current_len = curr_word_len
            else:
                current_chunk.append(line)
                current_len = line_len
        else:
            current_chunk.append(line)
            current_len += line_len
            
    if current_chunk:
        chunks.append('\n'.join(current_chunk))
    return chunks


def get_context_prefix(prev_chunk: str) -> str:
    if not prev_chunk:
        return ""
    sentences = re.split(r'(?<=[.!?])\s+', prev_chunk.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    clean_sentences = [s for s in sentences if s and s[-1] in ('.', '!', '?')]
    if not clean_sentences:
        clean_sentences = sentences
    last_sentences = clean_sentences[-3:] if len(clean_sentences) >= 3 else clean_sentences
    if last_sentences:
        prefix = " ".join(last_sentences)
        return f"[Context Prefix from previous segment: {prefix}]\n\n"
    return ""


async def process_segments_resilient(
    system_prompt: str,
    full_text: str,
    headers: dict[str, str],
    temperature: float,
    max_chunk_tokens: int = 8000
) -> list[str]:
    segments = split_text_by_tokens(full_text, max_chunk_tokens)
    results = []
    i = 0
    last_call_time = 0.0
    
    while i < len(segments):
        chunk = segments[i]
        context_prefix = get_context_prefix(segments[i - 1]) if i > 0 else ""
        
        # 5-second rate limit delay between consecutive API calls
        now = time.time()
        elapsed = now - last_call_time
        if i > 0 and elapsed < 5.0:
            await asyncio.sleep(5.0 - elapsed)
            
        try:
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{context_prefix}{chunk}"}
                ],
                "temperature": temperature,
                "response_format": {"type": "json_object"}
            }
            
            resp = await run_in_threadpool(
                http_requests.post,
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30
            )
            last_call_time = time.time()
            
            if resp.status_code == 200:
                content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "{}")
                results.append(content)
                i += 1
            elif resp.status_code in (413, 429):
                if max_chunk_tokens <= 200:
                    if resp.status_code == 429:
                        logger.warning("429 rate limit hit at minimum token size. Sleeping 10s and retrying...")
                        await asyncio.sleep(10.0)
                        continue
                    else:
                        raise GroqAPIError(resp.status_code, f"Failed with 413 payload too large at minimum chunk size: {resp.text}")
                
                new_max_tokens = max(200, max_chunk_tokens // 2)
                logger.warning(f"Groq API returned {resp.status_code}. Reducing max_chunk_tokens from {max_chunk_tokens} to {new_max_tokens} and re-splitting.")
                
                sub_segments = split_text_by_tokens(chunk, new_max_tokens)
                if len(sub_segments) > 1:
                    segments[i:i+1] = sub_segments
                    max_chunk_tokens = new_max_tokens
                else:
                    if resp.status_code == 429:
                        logger.warning("429 rate limit hit. Sleeping 10s before retry.")
                        await asyncio.sleep(10.0)
                    else:
                        half = len(chunk) // 2
                        segments[i:i+1] = [chunk[:half], chunk[half:]]
                        max_chunk_tokens = new_max_tokens
            else:
                raise GroqAPIError(resp.status_code, f"Groq API returned unexpected status code {resp.status_code}: {resp.text}")
                
        except Exception as e:
            logger.error(f"Error during Groq API call: {str(e)}")
            raise e
            
    return results


@router.post("/routes/analyze")
async def analyze_route_safety(body: RouteAnalysisRequest) -> dict[str, Any]:
    """Call Groq Llama 3.3 model to perform route safety and hazard analysis."""
    # Pakistan bounding box validation (longitude 60.87°E–77.84°E, latitude 23.63°N–37.09°N)
    rep_lat = body.rep_coord.get("lat")
    rep_lng = body.rep_coord.get("lng")
    if rep_lat is not None and rep_lng is not None:
        if not (23.63 <= rep_lat <= 37.09 and 60.87 <= rep_lng <= 77.84):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Representative coordinate must be within Pakistan boundary."
            )

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY is not configured on server"
        )

    waypoints_str = f"\n- Waypoints: {body.waypoints}" if getattr(body, "waypoints", None) else ""
    user_content = (
        f"Route Details:\n"
        f"- Origin: {body.origin}\n"
        f"- Destination: {body.destination}\n"
        f"- Distance: {body.distance:.2f} km\n"
        f"- Representative Coordinate: {body.rep_coord}{waypoints_str}\n\n"
        f"=== Weather API Feed ===\n"
        f"{body.weather}\n\n"
        f"=== Traffic Incidents API Feed ===\n"
        f"{body.traffic}\n\n"
        f"=== Air Quality API Feed ===\n"
        f"{body.air_quality}\n\n"
        f"=== Disaster Alerts API Feed ===\n"
        f"{body.disasters}\n"
    )

    system_prompt = (
        "You are a route safety analyst for Pakistan. You will receive route details (origin, destination, distance, coordinates) "
        "and live data from four API feeds: Weather, Traffic Incidents, Air Quality, and Disaster Alerts. "
        "Analyze the safety of the route and return a structured JSON object containing:\n"
        "1. 'safety_score': An overall route safety score from 1 to 10 (integer).\n"
        "2. 'weather_summary': A brief summary of weather conditions along the route.\n"
        "3. 'traffic_warning': Traffic and road blockage warnings.\n"
        "4. 'incidents_construction': Active construction or accidents details.\n"
        "5. 'air_quality_advisory': Air quality advisory and suggestions.\n"
        "6. 'recommendation': A final recommendation of either 'proceed', 'take alternate route', or 'avoid'.\n"
        "Provide ONLY the valid JSON object. Do not include conversational text or markdown code blocks."
    )

    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }

    try:
        # Use our resilient chunking processor
        # Max chunk tokens is set to 8000, leaving a safe buffer below 12000 TPM limit.
        results = await process_segments_resilient(
            system_prompt=system_prompt,
            full_text=user_content,
            headers=headers,
            temperature=0.4,
            max_chunk_tokens=8000
        )
        
        if not results:
            return {"status": "success", "analysis": "{}"}
            
        if len(results) == 1:
            return {"status": "success", "analysis": results[0]}
            
        # If multiple chunks, merge them using a final resilient Groq call
        merge_system_prompt = (
            "You are a route safety data aggregator. You will receive a list of route safety analysis JSON objects "
            "corresponding to different segments of a route. Synthesize and merge these analysis reports into a single coherent "
            "final JSON object containing:\n"
            "1. 'safety_score': An overall route safety score from 1 to 10 (integer) - choose the lowest safety score to be safe.\n"
            "2. 'weather_summary': A combined brief summary of weather conditions along the entire route.\n"
            "3. 'traffic_warning': Combined traffic and road blockage warnings.\n"
            "4. 'incidents_construction': Combined active construction or accidents details.\n"
            "5. 'air_quality_advisory': Combined air quality advisory and suggestions.\n"
            "6. 'recommendation': A final recommendation: if any segment recommends 'avoid', choose 'avoid'; "
            "if any segment recommends 'take alternate route' and none is 'avoid', choose 'take alternate route'; otherwise 'proceed'.\n"
            "Provide ONLY the valid JSON object. Do not include conversational text or markdown code blocks."
        )
        
        merge_user_content = "\n\n".join(
            f"Segment {idx+1} Analysis Report:\n{res}"
            for idx, res in enumerate(results)
        )
        
        # Enforce rate limit delay before final merge call
        await asyncio.sleep(5.0)
        
        merged_results = await process_segments_resilient(
            system_prompt=merge_system_prompt,
            full_text=merge_user_content,
            headers=headers,
            temperature=0.4,
            max_chunk_tokens=8000
        )
        
        if merged_results:
            return {"status": "success", "analysis": merged_results[0]}
        else:
            return {"status": "success", "analysis": "{}"}
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error contacting Groq API: {str(e)}"
        )


class SafetyWizardRequest(BaseModel):
    city: str
    source: str
    destination: str
    timestamp: Optional[str] = None


@router.post("/routes/safety-wizard")
async def analyze_safety_wizard(body: SafetyWizardRequest):
    """Call Anthropic Claude Sonnet 4 API to analyze route safety, with Groq and simulated fallbacks."""
    city = body.city
    source = body.source
    destination = body.destination

    # Convert incoming timestamp to Pakistan Standard Time (PKT, UTC+5)
    pkt_offset = timezone(timedelta(hours=5))
    if body.timestamp:
        try:
            ts_str = body.timestamp
            if ts_str.endswith('Z'):
                ts_str = ts_str.replace('Z', '+00:00')
            dt_raw = datetime.fromisoformat(ts_str)
            if dt_raw.tzinfo is not None:
                dt_pkt = dt_raw.astimezone(pkt_offset)
            else:
                dt_pkt = dt_raw.replace(tzinfo=timezone.utc).astimezone(pkt_offset)
        except Exception as e:
            logger.warning(f"Failed to parse timestamp '{body.timestamp}', defaulting to current server PKT: {e}")
            dt_pkt = datetime.now(timezone.utc).astimezone(pkt_offset)
    else:
        dt_pkt = datetime.now(timezone.utc).astimezone(pkt_offset)

    local_time_str = dt_pkt.strftime("%Y-%m-%d %I:%M %p")
    day_of_week = dt_pkt.strftime("%A")
    month_name = dt_pkt.strftime("%B")
    hour = dt_pkt.hour
    month = dt_pkt.month

    system_prompt = (
        "You are an expert route safety analyst for Pakistani cities with deep knowledge of local weather patterns, traffic conditions, air quality indices, road infrastructure, and urban hazards.\n"
        f"- City: {city}\n"
        f"- Source (Origin): {source}\n"
        f"- Destination: {destination}\n"
        f"- Current Local Date/Time: {local_time_str} ({day_of_week}, {month_name})\n\n"
        "Take this local date and time into account for eco-hazard evaluations:\n"
        "1. Traffic & Congestion: Weekday rush hours (8:00 AM - 10:00 AM, 5:00 PM - 8:00 PM) generally feature severe traffic gridlocks on direct routes, whereas night-time (11:00 PM - 6:00 AM) traffic is minimal but has lower visibility and higher night-driving risks.\n"
        "2. Weather & Diurnal Cycles: Temperature varies dramatically during the day (cooler nights, hot afternoons). High heat risk occurs in summer afternoons (May-August), and heavy rain/flash flood risks can occur during monsoon (July-September).\n"
        "3. Air Quality & Smog: Winter months (November to January) in northern/punjab cities like Lahore, Gujranwala, and Faisalabad suffer from extreme seasonal toxic smog (AQI often spikes 300-500+). Rush hour traffic also peaks air pollutants.\n\n"
        "Analyze route safety for two separate route options:\n"
        "1. Eco Route (the shortest/direct route)\n"
        "2. Alternative Route (a longer detour route)\n\n"
        "Return a single JSON object containing two main keys: \"eco\" and \"alternative\". "
        "Each key must map to a JSON object with ALL of these safety analysis fields (evaluate them independently based on the routes):\n"
        "{\n"
        "  \"safety_rating\": <integer 1-10>,\n"
        "  \"verdict\": \"PROCEED\" | \"CAUTION\" | \"AVOID\",\n"
        "  \"weather_summary\": \"<1-2 sentence summary including temperature in °C, humidity %, visibility>\",\n"
        "  \"traffic_warning\": \"<1-2 sentence summary of traffic from source to destination>\",\n"
        "  \"incidents_construction\": \"<1-2 sentence summary of any incidents, construction, road work>\",\n"
        "  \"air_quality_advisory\": \"<Include actual AQI number, PM2.5 and PM10 in µg/m³>\",\n"
        "  \"weather_severity\": \"LOW\" | \"MODERATE\" | \"HIGH\",\n"
        "  \"traffic_severity\": \"LOW\" | \"MODERATE\" | \"SEVERE\",\n"
        "  \"incident_severity\": \"CLEAR\" | \"MINOR\" | \"MAJOR\",\n"
        "  \"air_severity\": \"GOOD\" | \"MODERATE\" | \"POOR\",\n"
        "  \"weather_detail_temp\": \"<actual temp>°C — <context about comfort/heat risk>\",\n"
        "  \"weather_detail_vis\": \"<visibility distance and driving advice>\",\n"
        "  \"weather_detail_advisory\": \"<specific weather advisory for the city>\",\n"
        "  \"traffic_detail_level\": \"<describe congestion level, % capacity, lane conditions>\",\n"
        "  \"traffic_detail_delay\": \"<estimated delay in minutes over normal commute>\",\n"
        "  \"traffic_detail_rec\": \"<specific alternate route or timing recommendation>\",\n"
        "  \"incident_detail_active\": \"<count and description of active incidents>\",\n"
        "  \"incident_detail_construction\": \"<construction zones on route with details>\",\n"
        "  \"incident_detail_road\": \"<road surface condition: Good/Fair/Poor with details>\",\n"
        "  \"air_detail_pm\": \"PM2.5: <value> µg/m³ (<rating>) | PM10: <value> µg/m³\",\n"
        "  \"air_detail_health\": \"<health impact assessment for general and sensitive groups>\",\n"
        "  \"air_detail_precaution\": \"<specific precautions: mask type, windows, exposure limits>\"\n"
        "}\n\n"
        "Make sure the evaluations are independent. For example, traffic and incidents on the alternate route might differ from the eco route.\n"
        f"IMPORTANT: Use realistic values for {city}. "
        f"Pakistan cities like Lahore typically have AQI 100-180 (higher in winter smog), Islamabad 40-80, Karachi 70-120. "
        f"Summer temperatures: Lahore 35-45°C, Karachi 30-38°C, Islamabad 28-38°C, Multan 38-48°C, Quetta 25-35°C, Northern areas 15-25°C. "
        "Provide ONLY the JSON. No conversation, no markdown code blocks."
    )

    user_prompt = f"Please analyze route safety in {city} from {source} to {destination}."

    res_obj = None

    # Try Anthropic Claude Sonnet 4
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 4000,
                "messages": [
                    {"role": "user", "content": user_prompt}
                ],
                "system": system_prompt
            }
            resp = await run_in_threadpool(
                http_requests.post,
                url,
                json=payload,
                headers=headers,
                timeout=30
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["content"][0]["text"].strip()
                # Clean up any potential markdown formatting
                content = re.sub(r"^```json\s*", "", content, flags=re.MULTILINE)
                content = re.sub(r"\s*```$", "", content, flags=re.MULTILINE)
                res_obj = {"status": "success", "analysis": content, "provider": "anthropic"}
            else:
                logger.error(f"Anthropic API error {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error calling Anthropic API: {str(e)}")

    # Fallback to Groq if Groq key is present
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and not res_obj:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.4,
                "response_format": {"type": "json_object"}
            }
            resp = await run_in_threadpool(
                http_requests.post,
                url,
                json=payload,
                headers=headers,
                timeout=30
            )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"].strip()
                res_obj = {"status": "success", "analysis": content, "provider": "groq"}
            else:
                logger.error(f"Groq API error {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")

    if res_obj:
        try:
            analysis_content = res_obj.get("analysis", "{}")
            if isinstance(analysis_content, str):
                parsed = json.loads(analysis_content)
            else:
                parsed = analysis_content
            eco = parsed.get("eco", {})
            traffic_sev = eco.get("traffic_severity", "LOW")
            verdict = eco.get("verdict", "PROCEED")
            if traffic_sev == "SEVERE" or verdict == "AVOID":
                sev = "severe"
            elif traffic_sev == "MODERATE" or verdict == "CAUTION":
                sev = "moderate"
            else:
                sev = "low"
            corridor = f"{source} - {destination}"
            log_hazard_event_local(
                route_type="eco",
                city=city,
                severity=sev,
                day_of_week=day_of_week,
                hour_of_day=hour,
                corridor=corridor
            )
        except Exception as exc:
            logger.error(f"Failed to log hazard event during safety wizard analysis: {exc}")
        return res_obj

    # Final fallback: Simulated dynamic response with rich detail for BOTH eco and alternative routes
    import random
    import json

    # Determine season
    if month in [12, 1, 2]:
        season = "winter"
    elif month in [5, 6, 7, 8]:
        season = "summer"
    else:
        season = "shoulder"

    def generate_simulated_route_data(route_type: str):
        # City-seasonal temperature profiles
        city_seasonal_temps = {
            "Lahore": {"winter": (8, 18), "summer": (34, 43), "shoulder": (22, 33)},
            "Karachi": {"winter": (18, 28), "summer": (30, 38), "shoulder": (26, 32)},
            "Islamabad": {"winter": (4, 16), "summer": (28, 39), "shoulder": (18, 29)},
            "Multan": {"winter": (10, 22), "summer": (36, 45), "shoulder": (24, 34)},
            "Quetta": {"winter": (-2, 12), "summer": (24, 34), "shoulder": (12, 24)},
            "Gilgit": {"winter": (-5, 8), "summer": (15, 26), "shoulder": (5, 16)},
            "Skardu": {"winter": (-10, 5), "summer": (12, 23), "shoulder": (2, 13)},
            "Hunza": {"winter": (-12, 3), "summer": (10, 20), "shoulder": (0, 11)},
            "Peshawar": {"winter": (7, 19), "summer": (32, 41), "shoulder": (20, 31)},
            "Rawalpindi": {"winter": (5, 17), "summer": (28, 38), "shoulder": (18, 30)},
            "Hyderabad": {"winter": (15, 26), "summer": (34, 42), "shoulder": (25, 33)},
            "Faisalabad": {"winter": (7, 18), "summer": (34, 43), "shoulder": (22, 32)},
            "Gujranwala": {"winter": (7, 18), "summer": (33, 42), "shoulder": (22, 32)},
            "Sialkot": {"winter": (6, 17), "summer": (32, 40), "shoulder": (21, 31)},
            "Bahawalpur": {"winter": (9, 21), "summer": (36, 45), "shoulder": (24, 34)},
            "Abbottabad": {"winter": (2, 12), "summer": (20, 29), "shoulder": (11, 21)},
            "Muzaffarabad": {"winter": (4, 14), "summer": (24, 33), "shoulder": (13, 23)},
            "Gwadar": {"winter": (17, 25), "summer": (29, 35), "shoulder": (24, 30)},
        }
        temp_limits = city_seasonal_temps.get(city, {"winter": (10, 20), "summer": (30, 40), "shoulder": (20, 30)})[season]
        
        # Diurnal cooling/heating based on hour
        if 11 <= hour <= 17:
            temp = temp_limits[1] - random.randint(0, 3)
        elif 23 <= hour or hour <= 6:
            temp = temp_limits[0] + random.randint(0, 3)
        else:
            temp = int((temp_limits[0] + temp_limits[1]) / 2) + random.randint(-3, 3)

        # AQI profiles per city & season
        city_aqi_profiles = {
            "Lahore": {"winter": 340, "summer": 120, "shoulder": 180},
            "Faisalabad": {"winter": 290, "summer": 110, "shoulder": 160},
            "Gujranwala": {"winter": 280, "summer": 100, "shoulder": 150},
            "Multan": {"winter": 230, "summer": 90, "shoulder": 130},
            "Karachi": {"winter": 140, "summer": 75, "shoulder": 95},
            "Islamabad": {"winter": 95, "summer": 45, "shoulder": 60},
            "Rawalpindi": {"winter": 110, "summer": 55, "shoulder": 70},
            "Peshawar": {"winter": 160, "summer": 80, "shoulder": 110},
            "Quetta": {"winter": 110, "summer": 50, "shoulder": 75},
            "Gilgit": {"winter": 45, "summer": 20, "shoulder": 30},
            "Skardu": {"winter": 40, "summer": 15, "shoulder": 25},
            "Hunza": {"winter": 35, "summer": 15, "shoulder": 20},
        }
        aqi_base = city_aqi_profiles.get(city, {"winter": 120, "summer": 60, "shoulder": 80})[season]
        
        # Traffic pollution multiplier based on rush hours (8-10 AM, 5-8 PM)
        is_rush_hour = (8 <= hour <= 10) or (17 <= hour <= 20)
        is_weekday = day_of_week not in ["Saturday", "Sunday"]
        
        aqi_traffic_boost = 0
        if is_weekday and is_rush_hour:
            aqi_traffic_boost = random.randint(40, 70) if route_type == "eco" else random.randint(20, 40)
        elif not is_weekday and (18 <= hour <= 21):
            aqi_traffic_boost = random.randint(20, 45)
            
        aqi = aqi_base + aqi_traffic_boost + random.randint(-15, 15)
        aqi = max(10, aqi)
        
        pm25 = round(aqi * 0.45 + random.uniform(-3, 6), 1)
        pm10 = round(aqi * 0.85 + random.uniform(-6, 12), 1)

        # Traffic congestion levels and delays
        if is_weekday and is_rush_hour:
            if route_type == "eco":
                traffic_sev = "SEVERE"
                traffic_delay = random.randint(25, 45)
                traffic_level = "Gridlock — Roads at 90%+ capacity. Stop-and-go conditions across major central corridors."
            else:
                traffic_sev = "MODERATE"
                traffic_delay = random.randint(10, 20)
                traffic_level = "Moderate — 55-70% capacity utilized. Bypassing central bottlenecks but experience steady volume near merge lanes."
        elif is_weekday and (11 <= hour <= 16):
            traffic_sev = "MODERATE"
            traffic_delay = random.randint(8, 15)
            traffic_level = "Moderate — 50-60% capacity utilized. Standard daytime flow with typical delays at major intersections."
        elif not is_weekday and (18 <= hour <= 22):
            if route_type == "eco":
                traffic_sev = "MODERATE"
                traffic_delay = random.randint(12, 22)
                traffic_level = "Moderate to Heavy — High weekend leisure traffic near commercial zones and markets."
            else:
                traffic_sev = "LOW"
                traffic_delay = random.randint(3, 8)
                traffic_level = "Free-flowing — Standard weekend night flow on alternate corridors."
        else:
            traffic_sev = "LOW"
            traffic_delay = 0
            traffic_level = "Free-flowing — All lanes clear, negligible traffic."

        # Dynamically calculate Safety Score (1-10)
        base_rating = 9
        if traffic_sev == "SEVERE":
            base_rating -= 3
        elif traffic_sev == "MODERATE":
            base_rating -= 1
            
        if aqi > 300:
            base_rating -= 3  # Toxic smog
        elif aqi > 150:
            base_rating -= 1.5
        elif aqi > 100:
            base_rating -= 0.5
            
        if hour >= 23 or hour <= 5:
            base_rating -= 1  # Night-time driving risk
        elif temp > 40:
            base_rating -= 1.5  # Extreme heat risk

        rating = max(1, min(10, round(base_rating + random.uniform(-1, 1))))
        
        # Ensure difference between route options
        if route_type == "alternative":
            if rating > 6:
                rating = max(5, rating - random.randint(1, 2))
            else:
                rating = min(9, rating + random.randint(1, 2))

        verdict = "PROCEED" if rating >= 8 else ("CAUTION" if rating >= 5 else "AVOID")

        # Weather descriptions
        weather_conditions = {
            "PROCEED": [
                f"Clear sky over {city} at {temp}°C. Visibility is excellent at 12+ km. Light breeze from the east at 8 km/h.",
                f"Mostly sunny in {city}. Current temperature {temp}°C with 35% humidity. Ideal commuting conditions.",
            ],
            "CAUTION": [
                f"Partly cloudy with {temp}°C in {city}. Scattered light showers possible. Humidity at 65%. Visibility reduced to 6-8 km.",
                f"Hazy skies over {city} at {temp}°C. Dust haze reducing visibility to 4-6 km. Wind gusts up to 20 km/h.",
            ],
            "AVOID": [
                f"Heavy rain and thunderstorm warning in {city}. Temperature {temp}°C with 85% humidity. Visibility under 2 km. Flash flood risk.",
                f"Dense fog advisory for {city}. Temperature {temp}°C. Near-zero visibility on major highways. Extremely hazardous driving conditions.",
            ]
        }

        # Select matching weather text based on temperature and hour (e.g. night-time visibility)
        if (hour >= 23 or hour <= 5) and verdict == "PROCEED":
            weather_summary = f"Clear night in {city}. Temperature has dropped to {temp}°C. Light breeze, visibility is good at 10 km."
        elif (hour >= 23 or hour <= 5) and verdict == "CAUTION":
            weather_summary = f"Cool night in {city} at {temp}°C with dust haze reducing visibility to 4-5 km. Drive carefully."
        elif season == "winter" and aqi > 250 and (hour >= 22 or hour <= 8):
            weather_summary = f"Dense winter smog over {city} at {temp}°C. Visibility significantly impaired to under 1.5 km."
            verdict = "AVOID"
            rating = min(4, rating)
        else:
            weather_summary = random.choice(weather_conditions[verdict])

        weather_sev = "LOW" if temp <= 33 and (6 <= hour < 23) else ("MODERATE" if (33 < temp <= 40) or (hour >= 23 or hour <= 5) else "HIGH")
        
        # Traffic options
        if route_type == "alternative":
            traffic_options = {
                "PROCEED": f"Alternative route detour from {source} to {destination} is bypass-focused. Traffic is free-flowing at average speed 55 km/h.",
                "CAUTION": traffic_level,
                "AVOID": f"Slowdowns on alternative route due to overflow from primary closures. Speed reduced to 25 km/h but moving."
            }
        else:
            traffic_options = {
                "PROCEED": f"Smooth traffic flow on the route from {source} to {destination} in {city}. All lanes operational. Average speed 45 km/h.",
                "CAUTION": traffic_level,
                "AVOID": f"Severe gridlock reported from {source} to {destination}. Multiple lanes blocked. Average speed dropped to 5-8 km/h. Avoid if possible."
            }

        incident_sev = "CLEAR" if verdict == "PROCEED" else ("MINOR" if verdict == "CAUTION" else "MAJOR")
        
        # Incident options
        if route_type == "alternative":
            incident_options = {
                "PROCEED": f"Alternative corridor is fully clear of incidents and active roadworks. Pavement in good condition.",
                "CAUTION": f"Minor utility work on alternative route shoulder. All lanes open, caution advised near highway margins.",
                "AVOID": f"Active minor maintenance on alternate link. Speeds restricted, traffic merged to single lane."
            }
        else:
            incident_options = {
                "PROCEED": f"No active incidents or construction zones reported between {source} and {destination}. Road surface in good condition.",
                "CAUTION": f"Minor road maintenance near {destination}. Left lane narrowed for 200m. 1 stalled vehicle reported, traffic slow but moving.",
                "AVOID": f"Major collision at intersection near route midpoint. Road closure on primary artery between {source} and {destination}. Emergency vehicles on scene. Detour required."
            }

        air_sev = "GOOD" if aqi < 50 else ("MODERATE" if aqi < 100 else "POOR")

        return {
            "safety_rating": rating,
            "verdict": verdict,
            "weather_summary": weather_summary,
            "traffic_warning": traffic_options[verdict] if verdict in traffic_options else traffic_options["CAUTION"],
            "incidents_construction": incident_options[verdict],
            "air_quality_advisory": f"AQI in {city}: {aqi} ({'Good' if aqi < 50 else 'Moderate' if aqi < 100 else 'Unhealthy'}). PM2.5: {pm25} µg/m³ | PM10: {pm10} µg/m³.{' Sensitive groups should limit outdoor exposure.' if aqi >= 100 else ''}",
            "weather_severity": weather_sev,
            "traffic_severity": traffic_sev,
            "incident_severity": incident_sev,
            "air_severity": air_sev,
            "weather_detail_temp": f"{temp}°C — {'Extremely hot, risk of heatstroke. Stay hydrated and avoid travel during peak sun.' if temp > 40 else 'Hot conditions. Carry water and use sun protection.' if temp > 33 else 'Comfortable temperature range for travel.' if temp > 18 else 'Chilly weather. Dress in layers.' if temp > 5 else 'Freezing temperatures. Take extreme precautions.'}",
            "weather_detail_vis": f"{'Excellent visibility (>10 km). Safe for all travel.' if weather_sev == 'LOW' else 'Reduced visibility (4-7 km) due to night conditions or dust haze. Use headlights.' if weather_sev == 'MODERATE' else 'Dangerously low visibility (<1.5 km) due to dense smog or fog. Slow down, use fog lights.'}",
            "weather_detail_advisory": f"{'No active weather alerts for ' + city + '.' if weather_sev == 'LOW' else 'Night-time caution: slower reaction times, adjust speed.' if (hour >= 23 or hour <= 5) else 'High UV index and heat warning. Plan trips in air-conditioned transport.' if temp > 33 else 'Smog warning: high atmospheric particulates. Limit physical exertion.' if aqi > 150 else 'Standard seasonal advisory.'}",
            "traffic_detail_level": traffic_level,
            "traffic_detail_delay": f"+{traffic_delay} minutes over normal commute." if traffic_delay > 0 else "No measurable delay. ETA as expected.",
            "traffic_detail_rec": f"Direct route from {source} to {destination} is fully clear. No detour needed." if traffic_sev == "LOW" else f"Consider departing outside peak window (avoid 8-9:30 AM, 5-7 PM). Avoid central choke points." if traffic_sev == "MODERATE" else f"Eco route is highly congested. Detouring via Alternative route is highly recommended to save time.",
            "incident_detail_active": f"Zero active incidents on this segment. All-clear confirmed." if verdict == "PROCEED" else "1 minor incident: fender-bender near midpoint. Right lane partially blocked. Traffic moving slowly." if verdict == "CAUTION" else "2 active incidents: multi-vehicle collision at main intersection + road surface damage from burst water main. Emergency response in progress.",
            "incident_detail_construction": f"No construction zones between {source} and {destination}." if verdict == "PROCEED" else f"Utility repair work 300m before {destination}. Single lane operation for ~150m stretch. Flaggers directing traffic." if verdict == "CAUTION" else f"Major infrastructure project in {city}: Road widening causing full closure of westbound lanes. Heavy machinery active.",
            "incident_detail_road": f"Good — Smooth, well-maintained asphalt throughout. No potholes or uneven surfaces." if verdict == "PROCEED" else "Fair — Generally good with 2-3 rough patches near construction zone. Speed bumps at school zones. Drive with care." if verdict == "CAUTION" else "Poor — Multiple potholes, broken surface near incident area. Uneven patches and loose gravel on detour roads. Reduce speed to 20 km/h in affected zones.",
            "air_detail_pm": f"PM2.5: {pm25} µg/m³ {'(Good - well within WHO limits)' if pm25 < 25 else '(Moderate - acceptable)' if pm25 < 55 else '(Unhealthy - exceeds safe limits)'} | PM10: {pm10} µg/m³.",
            "air_detail_health": f"{'No health risk for any population group. Enjoy outdoor activities freely.' if air_sev == 'GOOD' else 'Generally safe. Sensitive individuals may experience mild respiratory discomfort during prolonged outdoor activity.' if air_sev == 'MODERATE' else 'Health alert: High smog/AQI levels. Sensitive groups (asthma, elderly, children) at elevated risk. General population may experience eye and throat irritation.'}",
            "air_detail_precaution": f"{'No special precautions required. Windows-down driving is fine.' if air_sev == 'GOOD' else 'Optional: Wear a standard mask during extended outdoor exposure. Keep car windows up in heavy traffic areas.' if air_sev == 'MODERATE' else 'Wear N95/KN95 mask outdoors. Keep all vehicle windows sealed. Use AC on recirculation mode. Limit outdoor exposure.'}"
        }

    if not res_obj:
        simulated_analysis = {
            "eco": generate_simulated_route_data("eco"),
            "alternative": generate_simulated_route_data("alternative")
        }
        res_obj = {"status": "success", "analysis": json.dumps(simulated_analysis), "provider": "mock"}

    try:
        analysis_content = res_obj.get("analysis", "{}")
        if isinstance(analysis_content, str):
            parsed = json.loads(analysis_content)
        else:
            parsed = analysis_content
            
        eco = parsed.get("eco", {})
        traffic_sev = eco.get("traffic_severity", "LOW")
        verdict = eco.get("verdict", "PROCEED")
        
        if traffic_sev == "SEVERE" or verdict == "AVOID":
            sev = "severe"
        elif traffic_sev == "MODERATE" or verdict == "CAUTION":
            sev = "moderate"
        else:
            sev = "low"
            
        corridor = f"{source} - {destination}"
        log_hazard_event_local(
            route_type="eco",
            city=city,
            severity=sev,
            day_of_week=day_of_week,
            hour_of_day=hour,
            corridor=corridor
        )
    except Exception as exc:
        logger.error(f"Failed to log hazard event during safety wizard analysis: {exc}")

    return res_obj


@router.get("/client/congestion-report")
async def client_congestion_report(
    city: Optional[str] = "All",
    week_start: Optional[str] = None,
    corridor: Optional[str] = "All"
) -> dict[str, Any]:
    """
    Returns weekly peak-hour eco route congestion report data.
    """
    # 1. Fetch events from Supabase or fallback
    db_events = supabase_client.get_hazard_events()
    if db_events is None:
        events = hazard_events_history
    else:
        events = db_events

    # Find the current Monday if week_start is not specified
    now = datetime.now(timezone.utc)
    monday = now - timedelta(days=now.weekday())
    default_week_start = monday.strftime("%Y-%m-%d")
    
    selected_week_start = week_start or default_week_start

    try:
        ws_date = datetime.strptime(selected_week_start, "%Y-%m-%d").date()
    except Exception:
        ws_date = monday.date()

    we_date = ws_date + timedelta(days=7)

    # 2. Filter events (Must be route_type = 'eco' and severity = 'severe')
    filtered = []
    all_eco_severe = []  # For extracting corridors list (optionally filtered by city)
    
    for e in events:
        # Route type and severity checks
        if e.get("route_type") != "eco" or e.get("severity") != "severe":
            continue
            
        # Parse created_at to check date range
        created_at_str = e.get("created_at")
        if not created_at_str:
            continue
        try:
            # handle 'Z' replacement or other formats
            clean_ts = created_at_str.replace("Z", "+00:00")
            evt_date = datetime.fromisoformat(clean_ts).date()
        except Exception:
            continue
            
        # Filter city
        evt_city = e.get("city", "Unknown")
        if city and city.lower() != "all" and evt_city.lower() != city.lower():
            continue
            
        all_eco_severe.append(e)

        # Filter week
        if not (ws_date <= evt_date < we_date):
            continue
            
        # Filter corridor
        evt_corridor = e.get("corridor", "Unknown")
        if corridor and corridor.lower() != "all" and evt_corridor.lower() != corridor.lower():
            continue

        filtered.append(e)

    # Extract unique corridors
    corridors_set = set()
    for e in all_eco_severe:
        c = e.get("corridor")
        if c:
            corridors_set.add(c)
    corridors_list = sorted(list(corridors_set))

    # 3. Summaries & calculations
    total_flags = len(filtered)
    
    # Peak day calculation
    day_counts = {}
    for e in filtered:
        d = e.get("day_of_week", "Unknown").capitalize()
        day_counts[d] = day_counts.get(d, 0) + 1
    
    if day_counts:
        peak_day = max(day_counts, key=day_counts.get)
    else:
        peak_day = "N/A"

    # Worst hour calculation
    hour_counts = {}
    for e in filtered:
        h = e.get("hour_of_day")
        if h is not None:
            hour_counts[h] = hour_counts.get(h, 0) + 1
            
    if hour_counts:
        worst_hour_num = max(hour_counts, key=hour_counts.get)
        worst_hour = f"{worst_hour_num:02d}:00"
    else:
        worst_hour = "N/A"

    # AM/PM Counts & Split Ratio (AM: 8-10, PM: 17-20)
    am_count = 0
    pm_count = 0
    for e in filtered:
        h = e.get("hour_of_day")
        if h is not None:
            if 8 <= h < 10:
                am_count += 1
            elif 17 <= h < 20:
                pm_count += 1

    total_rush = am_count + pm_count
    if total_rush > 0:
        am_ratio = round((am_count / total_rush) * 100)
        pm_ratio = round((pm_count / total_rush) * 100)
    else:
        am_ratio = 50
        pm_ratio = 50

    # 4. Grouped Bar Chart
    days_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    am_by_day = {d: 0 for d in days_week}
    pm_by_day = {d: 0 for d in days_week}
    for e in filtered:
        d = e.get("day_of_week", "Unknown").capitalize()
        if d in am_by_day:
            h = e.get("hour_of_day")
            if h is not None:
                if 8 <= h < 10:
                    am_by_day[d] += 1
                elif 17 <= h < 20:
                    pm_by_day[d] += 1

    bar_labels = days_week
    bar_am_data = [am_by_day[d] for d in days_week]
    bar_pm_data = [pm_by_day[d] for d in days_week]

    # 5. Hourly Intensity Line Chart (8:00 to 20:00)
    hours_line = list(range(8, 21)) # 8 to 20 inclusive
    hourly_intensity_counts = {h: 0 for h in hours_line}
    for e in filtered:
        h = e.get("hour_of_day")
        if h in hourly_intensity_counts:
            hourly_intensity_counts[h] += 1

    line_labels = [f"{h:02d}:00" for h in hours_line]
    line_data = [hourly_intensity_counts[h] for h in hours_line]

    return {
        "status": "success",
        "summary": {
            "total_flags": total_flags,
            "peak_day": peak_day,
            "worst_hour": worst_hour,
            "am_count": am_count,
            "pm_count": pm_count,
            "am_ratio": am_ratio,
            "pm_ratio": pm_ratio
        },
        "bar_chart": {
            "labels": bar_labels,
            "am_data": bar_am_data,
            "pm_data": bar_pm_data
        },
        "line_chart": {
            "labels": line_labels,
            "data": line_data
        },
        "corridors": corridors_list
    }


