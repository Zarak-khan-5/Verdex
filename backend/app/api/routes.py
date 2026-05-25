import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import requests as http_requests

from fastapi import APIRouter, HTTPException, status
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


class BestRoute(BaseModel):
    mode: str
    total_time_mins: int
    co2_saved_kg: float
    path_coordinates: list[list[float]]


class RouteResponse(BaseModel):
    status: str
    best_route: BestRoute
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
]

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
    result = optimize_route(
        origin={"lat": body.origin.lat, "lng": body.origin.lng},
        destination={"lat": body.destination.lat, "lng": body.destination.lng},
        preferences=body.preferences.model_dump() if body.preferences else {},
    )

    # Persist to live Supabase if active
    new_route = supabase_client.create_route(
        user_id=body.user_id,
        source_coords={"lat": body.origin.lat, "lng": body.origin.lng},
        dest_coords={"lat": body.destination.lat, "lng": body.destination.lng},
        mode=result["best_route"]["mode"],
        total_time_mins=result["best_route"]["total_time_mins"],
        co2_saved_kg=result["best_route"]["co2_saved_kg"]
    )
    
    if new_route:
        route_id = new_route["route_id"]
        if result["best_route"]["co2_saved_kg"] > 0:
            supabase_client.create_carbon_record(
                user_id=body.user_id,
                route_id=route_id,
                co2_saved=result["best_route"]["co2_saved_kg"]
            )
    else:
        # Fallback to local in-memory stores
        route_entry: dict[str, Any] = {
            "route_id": str(uuid.uuid4()),
            "user_id": body.user_id,
            "source_coords": {"lat": body.origin.lat, "lng": body.origin.lng},
            "dest_coords": {"lat": body.destination.lat, "lng": body.destination.lng},
            "mode": result["best_route"]["mode"],
            "total_time_mins": result["best_route"]["total_time_mins"],
            "co2_saved_kg": result["best_route"]["co2_saved_kg"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        routes_history.append(route_entry)

        if result["best_route"]["co2_saved_kg"] > 0:
            carbon_records.append(
                {
                    "record_id": str(uuid.uuid4()),
                    "user_id": body.user_id,
                    "route_id": route_entry["route_id"],
                    "co2_saved": result["best_route"]["co2_saved_kg"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )

    return RouteResponse(**result)


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
async def client_metrics() -> dict[str, Any]:
    """Return mock city-wide metrics for the client / planner dashboard."""
    return {
        "total_co2_saved_kg": 2847.5,
        "total_routes_optimized": 12450,
        "active_users": 342,
        "monthly_trend": [
            {"month": "Jan", "co2_saved": 320.0},
            {"month": "Feb", "co2_saved": 385.4},
            {"month": "Mar", "co2_saved": 410.2},
            {"month": "Apr", "co2_saved": 475.8},
            {"month": "May", "co2_saved": 520.3},
            {"month": "Jun", "co2_saved": 735.8},
        ],
        "top_modes": [
            {"mode": "metro + walking", "count": 4820, "percentage": 38.7},
            {"mode": "bus + metro", "count": 3540, "percentage": 28.4},
            {"mode": "bike", "count": 2490, "percentage": 20.0},
            {"mode": "walking", "count": 1600, "percentage": 12.9},
        ],
    }


@router.get("/enviro/data")
async def enviro_data(lat: float = 31.5204, lon: float = 74.3587) -> dict[str, Any]:
    """Proxy environmental data from Open-Meteo APIs + simulated traffic."""
    # Pakistan bounding box pre-filter (longitude 60.87°E–77.84°E, latitude 23.63°N–37.09°N)
    if not (23.63 <= lat <= 37.09 and 60.87 <= lon <= 77.84):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordinates must be within Pakistan bounding box (PK)."
        )

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


@router.post("/routes/analyze")
async def analyze_route_safety(body: RouteAnalysisRequest) -> dict[str, Any]:
    """Call Groq Llama 3.3 model to perform route safety and hazard analysis."""
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
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.4,
        "response_format": {"type": "json_object"}
    }

    try:
        resp = http_requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=30
        )
        if resp.status_code == 200:
            content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "{}")
            return {"status": "success", "analysis": content}
        else:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Groq API returned status code {resp.status_code}: {resp.text}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error contacting Groq API: {str(e)}"
        )

