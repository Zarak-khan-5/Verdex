import math
import random
from typing import Any

# ---------------------------------------------------------------------------
# System Prompt (from REQUIRE.md Section 9)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT: str = (
    "You are the Verdex Route Optimizer. You receive coordinates, weather data, "
    "and transit options. You must act as a logic engine, not a chatbot. Do not "
    "output conversational text. Output ONLY valid JSON calculating the most "
    "eco-friendly route, comparing the carbon emissions of a solo car ride versus "
    "walking, biking, or taking the bus."
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
EARTH_RADIUS_KM: float = 6371.0
CAR_CO2_PER_KM: float = 0.21  # kg CO2 per km for a solo car

# Speed estimates (km/h)
SPEED_WALKING: float = 5.0
SPEED_BIKE: float = 52.0
SPEED_METRO: float = 40.0
SPEED_BUS: float = 25.0


# ---------------------------------------------------------------------------
# Haversine Distance
# ---------------------------------------------------------------------------

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth (km)."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


# ---------------------------------------------------------------------------
# Path Interpolation
# ---------------------------------------------------------------------------

def _interpolate_path(
    origin: dict[str, float],
    destination: dict[str, float],
    num_points: int | None = None,
    is_alternate: bool = False,
) -> list[list[float]]:
    """Generate intermediate waypoints between origin and destination with
    slight random offsets to simulate a realistic path.
    If is_alternate is True, applies a quadratic Bezier curve bowing effect
    to represent a distinct detour path.
    Returns a list of [lat, lng] pairs matching the frontend contract."""
    if num_points is None:
        num_points = random.randint(10, 14) if is_alternate else random.randint(5, 8)

    points: list[list[float]] = [[origin["lat"], origin["lng"]]]
    
    # Calculate perpendicular offsets for curving the alternate route
    d_lat = destination["lat"] - origin["lat"]
    d_lng = destination["lng"] - origin["lng"]
    # Perpendicular vector: (-d_lng, d_lat)
    perp_lat = -d_lng
    perp_lng = d_lat
    
    # Scale of curve (displacement relative to route length)
    # A positive offset bows the path to one side
    curve_direction = 0.25 if is_alternate else 0.0

    for i in range(1, num_points + 1):
        fraction = i / (num_points + 1)
        lat = origin["lat"] + fraction * d_lat
        lng = origin["lng"] + fraction * d_lng
        
        # Add quadratic curve offset: max at midpoint (fraction = 0.5)
        # Offset = 4 * fraction * (1 - fraction) * perp * curve_direction
        curve_offset = 4.0 * fraction * (1.0 - fraction)
        lat += perp_lat * curve_offset * curve_direction
        lng += perp_lng * curve_offset * curve_direction
        
        # Add slight random offset to simulate real streets
        jitter_limit = 0.003 if is_alternate else 0.002
        lat += random.uniform(-jitter_limit, jitter_limit)
        lng += random.uniform(-jitter_limit, jitter_limit)
        points.append([round(lat, 6), round(lng, 6)])
        
    points.append([destination["lat"], destination["lng"]])
    return points


# ---------------------------------------------------------------------------
# Mode Selection
# ---------------------------------------------------------------------------

def _select_mode(distance_km: float) -> str:
    """Choose the best transportation mode based on distance."""
    if distance_km < 2:
        return "walking"
    elif distance_km < 5:
        return "bike"
    elif distance_km < 15:
        return "metro + walking"
    else:
        return "bus + metro"


# ---------------------------------------------------------------------------
# Time Estimation
# ---------------------------------------------------------------------------

def _estimate_time_mins(distance_km: float, mode: str) -> int:
    """Estimate travel time in minutes for the given distance and mode."""
    if mode == "walking":
        hours = distance_km / SPEED_WALKING
    elif mode == "bike":
        hours = distance_km / SPEED_BIKE
    elif mode == "metro + walking":
        # Assume 20 % walking, 80 % metro
        walk_km = distance_km * 0.2
        metro_km = distance_km * 0.8
        hours = (walk_km / SPEED_WALKING) + (metro_km / SPEED_METRO)
    elif mode == "bus + metro":
        # Assume 40 % bus, 60 % metro
        bus_km = distance_km * 0.4
        metro_km = distance_km * 0.6
        hours = (bus_km / SPEED_BUS) + (metro_km / SPEED_METRO)
    else:
        hours = distance_km / SPEED_WALKING  # fallback
    return max(1, round(hours * 60))


# ---------------------------------------------------------------------------
# CO2 Savings
# ---------------------------------------------------------------------------

def _calculate_co2_saved(distance_km: float, mode: str) -> float:
    """Calculate CO2 saved compared to solo car travel (kg)."""
    car_co2 = distance_km * CAR_CO2_PER_KM
    # Emission factors for alternative modes (kg CO2 / km)
    mode_factors: dict[str, float] = {
        "walking": 0.0,
        "bike": 0.0,
        "metro + walking": 0.04,
        "bus + metro": 0.06,
    }
    mode_co2 = distance_km * mode_factors.get(mode, 0.0)
    saved = car_co2 - mode_co2
    return round(max(0.0, saved), 2)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def optimize_route(
    origin: dict[str, Any],
    destination: dict[str, Any],
    preferences: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Optimize a route between *origin* and *destination*, producing both Eco and Alternative versions.

    Parameters
    ----------
    origin : dict
        ``{"lat": float, "lng": float}``
    destination : dict
        ``{"lat": float, "lng": float}``
    preferences : dict, optional
        User preferences such as ``{"max_walk_time_mins": int}``.

    Returns
    -------
    dict
        A dictionary containing both eco_route and alt_route data.
    """
    if preferences is None:
        preferences = {}

    origin_lat: float = float(origin.get("lat", 0))
    origin_lng: float = float(origin.get("lng", 0))
    dest_lat: float = float(destination.get("lat", 0))
    dest_lng: float = float(destination.get("lng", 0))

    # 1. Direct distance
    distance_eco = _haversine(origin_lat, origin_lng, dest_lat, dest_lng)
    
    # 2. Eco Route Mode & Stats
    mode_eco = _select_mode(distance_eco)
    max_walk = preferences.get("max_walk_time_mins")
    if max_walk is not None and mode_eco == "walking":
        walk_time = (distance_eco / SPEED_WALKING) * 60
        if walk_time > max_walk:
            mode_eco = "bike"
            
    time_eco = _estimate_time_mins(distance_eco, mode_eco)
    co2_eco = _calculate_co2_saved(distance_eco, mode_eco)
    path_eco = _interpolate_path(
        {"lat": origin_lat, "lng": origin_lng},
        {"lat": dest_lat, "lng": dest_lng},
        is_alternate=False
    )
    
    # 3. Alternative Route Mode & Stats (Longer path)
    # 45% longer distance detour
    distance_alt = distance_eco * 1.45
    mode_alt = _select_mode(distance_alt)
    time_alt = _estimate_time_mins(distance_alt, mode_alt)
    co2_alt = _calculate_co2_saved(distance_alt, mode_alt)
    path_alt = _interpolate_path(
        {"lat": origin_lat, "lng": origin_lng},
        {"lat": dest_lat, "lng": dest_lng},
        is_alternate=True
    )

    # 4. Carbon credits (computed on Eco route as baseline, or general selection)
    carbon_credits_eco = round(co2_eco / 0.5, 2) if co2_eco > 0 else 0.0
    carbon_credits_alt = round(co2_alt / 0.5, 2) if co2_alt > 0 else 0.0

    return {
        "status": "success",
        "eco_route": {
            "mode": mode_eco,
            "total_time_mins": time_eco,
            "co2_saved_kg": co2_eco,
            "path_coordinates": path_eco,
            "distance_km": round(distance_eco, 2),
            "carbon_credits_earned": carbon_credits_eco
        },
        "alt_route": {
            "mode": mode_alt,
            "total_time_mins": time_alt,
            "co2_saved_kg": co2_alt,
            "path_coordinates": path_alt,
            "distance_km": round(distance_alt, 2),
            "carbon_credits_earned": carbon_credits_alt
        }
    }
