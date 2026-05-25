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
SPEED_BIKE: float = 15.0
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
) -> list[list[float]]:
    """Generate intermediate waypoints between origin and destination with
    slight random offsets to simulate a realistic path.
    Returns a list of [lat, lng] pairs matching the frontend contract."""
    if num_points is None:
        num_points = random.randint(5, 8)

    points: list[list[float]] = [[origin["lat"], origin["lng"]]]
    for i in range(1, num_points + 1):
        fraction = i / (num_points + 1)
        lat = origin["lat"] + fraction * (destination["lat"] - origin["lat"])
        lng = origin["lng"] + fraction * (destination["lng"] - origin["lng"])
        # Add slight random offset to simulate real streets
        lat += random.uniform(-0.002, 0.002)
        lng += random.uniform(-0.002, 0.002)
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
    """Optimize a route between *origin* and *destination*.

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
        A ``RouteResponse``-shaped dictionary::

            {
                "status": "success",
                "best_route": {
                    "mode": str,
                    "total_time_mins": int,
                    "co2_saved_kg": float,
                    "path_coordinates": list[dict]
                },
                "carbon_credits_earned": float
            }
    """
    if preferences is None:
        preferences = {}

    origin_lat: float = float(origin.get("lat", 0))
    origin_lng: float = float(origin.get("lng", 0))
    dest_lat: float = float(destination.get("lat", 0))
    dest_lng: float = float(destination.get("lng", 0))

    # Pakistan bounding box pre-filter (longitude 60.87°E–77.84°E, latitude 23.63°N–37.09°N)
    if not (23.63 <= origin_lat <= 37.09 and 60.87 <= origin_lng <= 77.84) or \
       not (23.63 <= dest_lat <= 37.09 and 60.87 <= dest_lng <= 77.84):
        return {
            "status": "error",
            "best_route": {
                "mode": "unknown",
                "total_time_mins": 0,
                "co2_saved_kg": 0.0,
                "path_coordinates": []
            },
            "carbon_credits_earned": 0.0
        }


    # 1. Haversine distance
    distance_km = _haversine(origin_lat, origin_lng, dest_lat, dest_lng)

    # 2. Mode selection (honour max_walk_time preference)
    mode = _select_mode(distance_km)
    max_walk = preferences.get("max_walk_time_mins")
    if max_walk is not None and mode == "walking":
        walk_time = (distance_km / SPEED_WALKING) * 60
        if walk_time > max_walk:
            mode = "bike"

    # 3. Travel time
    total_time_mins = _estimate_time_mins(distance_km, mode)

    # 4. CO2 savings
    co2_saved_kg = _calculate_co2_saved(distance_km, mode)

    # 5. Path interpolation
    path_coordinates = _interpolate_path(
        {"lat": origin_lat, "lng": origin_lng},
        {"lat": dest_lat, "lng": dest_lng},
    )

    # 6. Carbon credits (1 credit per 0.5 kg CO2 saved)
    carbon_credits_earned = round(co2_saved_kg / 0.5, 2) if co2_saved_kg > 0 else 0.0

    return {
        "status": "success",
        "best_route": {
            "mode": mode,
            "total_time_mins": total_time_mins,
            "co2_saved_kg": co2_saved_kg,
            "path_coordinates": path_coordinates,
        },
        "carbon_credits_earned": carbon_credits_earned,
    }
