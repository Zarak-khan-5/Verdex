import requests
import json

def test_nominatim_city_search(city_name):
    print(f"--- Searching city: {city_name} ---")
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": city_name,
        "featureType": "city",
        "format": "json",
        "limit": 5,
        "addressdetails": 1,
        "countrycodes": "pk"
    }
    headers = {
        'User-Agent': 'VerdexAINav/2.4'
    }
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print("Status code:", response.status_code)
        if response.status_code != 200:
            print("Failed to get 200 response")
            return None
        
        data = response.json()
        if not data:
            print("No cities found.")
            return None
        
        for idx, item in enumerate(data):
            addr = item.get("address", {})
            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality") or addr.get("county") or item.get("name") or "Unknown City"
            region = addr.get("state") or addr.get("region") or addr.get("province") or ""
            country = addr.get("country") or ""
            bbox = item.get("boundingbox")
            print(f"[{idx}] {city}, {region}, {country} | Bbox: {bbox}")
            
        return data[0]
    except Exception as e:
        print("Error during request:", e)
        return None

def test_nominatim_bounded_search(query, bbox):
    print(f"\n--- Searching within bbox: {query} ---")
    south, north, west, east = float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 5,
        "bounded": 1,
        "viewbox": f"{west},{south},{east},{north}",
        "countrycodes": "pk"
    }
    headers = {
        'User-Agent': 'VerdexAINav/2.4'
    }
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print("Status code:", response.status_code)
        data = response.json()
        if not data:
            print("No items found inside bounds.")
            return []
        
        for idx, item in enumerate(data):
            lat = float(item.get("lat"))
            lon = float(item.get("lon"))
            name = item.get("display_name")
            
            # Check within bounds
            lat_ok = south <= lat <= north
            # handle wrap around if any, but standard:
            lon_ok = west <= lon <= east if west <= east else (lon >= west or lon <= east)
            is_inside = lat_ok and lon_ok
            print(f"[{idx}] {name[:60]}... | Lat: {lat}, Lon: {lon} | Inside bbox: {is_inside}")
            
        return data
    except Exception as e:
        print("Error during request:", e)
        return []

if __name__ == "__main__":
    city_data = test_nominatim_city_search("Lahore")
    if city_data and "boundingbox" in city_data:
        bbox = city_data["boundingbox"]
        # Search for something inside Lahore
        test_nominatim_bounded_search("Mall Road", bbox)
        # Search for something outside Lahore (should be restricted because bounded=1)
        test_nominatim_bounded_search("Faisalabad", bbox)

    # Search for a city outside Pakistan to verify it returns no results (or filters properly)
    print("\n--- Verifying non-Pakistan city search gets blocked/filtered ---")
    city_data_london = test_nominatim_city_search("London")
    if city_data_london:
        print("FAIL: London returned results under Pakistan-only filter.")
    else:
        print("SUCCESS: London returned no results under Pakistan-only filter.")
