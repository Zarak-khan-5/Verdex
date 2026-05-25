import os
import logging
from typing import Any, Optional
import requests

logger = logging.getLogger("app.database")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Check if Supabase is properly configured (i.e. not the default placeholder)
is_db_enabled = (
    bool(SUPABASE_URL)
    and bool(SUPABASE_KEY)
    and "your-project" not in SUPABASE_URL
    and "your-anon-key" not in SUPABASE_KEY
)

if is_db_enabled:
    logger.info("Supabase live database connection enabled.")
else:
    logger.warning("Supabase credentials are default placeholders. Falling back to in-memory mock stores.")

def _get_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def get_user_by_email(email: str) -> Optional[dict[str, Any]]:
    if not is_db_enabled:
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/Users?email=eq.{email}"
        resp = requests.get(url, headers=_get_headers(), timeout=5)
        if resp.status_code == 200:
            users = resp.json()
            if users:
                user = users[0]
                # Map database password_hash to mock store password format
                user["password"] = user.get("password_hash")
                return user
        else:
            logger.error(f"Supabase returned status code {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Error querying user from Supabase: {e}")
    return None

def create_user(name: str, email: str, password_raw: str, role: str) -> Optional[dict[str, Any]]:
    if not is_db_enabled:
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/Users"
        payload = {
            "name": name,
            "email": email,
            "password_hash": password_raw,  # using raw password for mock compatibility
            "role": role
        }
        resp = requests.post(url, json=payload, headers=_get_headers(), timeout=5)
        if resp.status_code in (200, 201):
            users = resp.json()
            if users:
                user = users[0]
                user["password"] = user.get("password_hash")
                return user
    except Exception as e:
        logger.error(f"Error inserting user into Supabase: {e}")
    return None

def create_session(user_id: str) -> Optional[dict[str, Any]]:
    if not is_db_enabled:
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/Sessions"
        payload = {
            "user_id": user_id,
            "is_active": True
        }
        resp = requests.post(url, json=payload, headers=_get_headers(), timeout=5)
        if resp.status_code in (200, 201):
            sessions = resp.json()
            if sessions:
                return sessions[0]
    except Exception as e:
        logger.error(f"Error inserting session into Supabase: {e}")
    return None

def get_active_sessions() -> Optional[list[dict[str, Any]]]:
    if not is_db_enabled:
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/Sessions?is_active=eq.true"
        resp = requests.get(url, headers=_get_headers(), timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Error retrieving sessions from Supabase: {e}")
    return None

def create_route(
    user_id: str,
    source_coords: dict[str, float],
    dest_coords: dict[str, float],
    mode: str,
    total_time_mins: int,
    co2_saved_kg: float
) -> Optional[dict[str, Any]]:
    if not is_db_enabled:
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/Routes"
        payload = {
            "user_id": user_id,
            "source_coords": source_coords,
            "dest_coords": dest_coords,
            "mode": mode,
            "total_time_mins": total_time_mins,
            "co2_saved_kg": co2_saved_kg
        }
        resp = requests.post(url, json=payload, headers=_get_headers(), timeout=5)
        if resp.status_code in (200, 201):
            routes = resp.json()
            if routes:
                return routes[0]
    except Exception as e:
        logger.error(f"Error inserting route into Supabase: {e}")
    return None

def get_route_history(user_id: str) -> Optional[list[dict[str, Any]]]:
    if not is_db_enabled:
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/Routes?user_id=eq.{user_id}"
        resp = requests.get(url, headers=_get_headers(), timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Error retrieving routes history from Supabase: {e}")
    return None

def create_carbon_record(user_id: str, route_id: str, co2_saved: float) -> Optional[dict[str, Any]]:
    if not is_db_enabled:
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/CarbonRecords"
        payload = {
            "user_id": user_id,
            "route_id": route_id,
            "co2_saved": co2_saved
        }
        resp = requests.post(url, json=payload, headers=_get_headers(), timeout=5)
        if resp.status_code in (200, 201):
            records = resp.json()
            if records:
                return records[0]
    except Exception as e:
        logger.error(f"Error inserting carbon record into Supabase: {e}")
    return None
