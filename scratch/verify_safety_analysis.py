import requests
import json

def test_safety_analysis():
    url = "http://127.0.0.1:8000/api/routes/analyze"
    
    # Simulate coords for a route in London
    # Let's say we have 30 waypoints, we'll thin it to every 5th point (6 points)
    raw_coords = [
        [-0.1278, 51.5074], [-0.1277, 51.5073], [-0.1276, 51.5072], [-0.1275, 51.5071], [-0.1274, 51.5070],
        [-0.1273, 51.5069], [-0.1272, 51.5068], [-0.1271, 51.5067], [-0.1270, 51.5066], [-0.1269, 51.5065],
        [-0.1268, 51.5064], [-0.1267, 51.5063], [-0.1266, 51.5062], [-0.1265, 51.5061], [-0.1264, 51.5060],
        [-0.1263, 51.5059], [-0.1262, 51.5058], [-0.1261, 51.5057], [-0.1260, 51.5056], [-0.1259, 51.5055],
        [-0.1258, 51.5054], [-0.1257, 51.5053], [-0.1256, 51.5052], [-0.1255, 51.5051], [-0.1254, 51.5050],
        [-0.1253, 51.5049], [-0.1252, 51.5048], [-0.1251, 51.5047], [-0.1250, 51.5046], [-0.1245, 51.5007]
    ]
    
    thinned = raw_coords[::5]
    print(f"Original coordinates length: {len(raw_coords)}, Thinned coordinates length: {len(thinned)}")
    
    payload = {
        "origin": "Trafalgar Square",
        "destination": "Big Ben",
        "distance": 1.2,
        "rep_coord": {"lat": 51.505, "lng": -0.126},
        "waypoints": thinned,
        "weather": {
            "temperature_2m": 15.5,
            "precipitation": 0.0,
            "windspeed_10m": 8.5,
            "weathercode": 0
        },
        "traffic": {
            "incidents": []
        },
        "air_quality": {
            "results": [
                {
                    "measurements": [
                        {"parameter": "pm25", "value": 12.0}
                    ]
                }
            ]
        },
        "disasters": {
            "data": []
        }
    }
    
    print("Sending request to /api/routes/analyze...")
    try:
        response = requests.post(url, json=payload, timeout=40)
        print("Status code:", response.status_code)
        if response.status_code == 200:
            result = response.json()
            print("\nResponse Analysis Content:")
            print(json.dumps(result, indent=2))
        else:
            print("Error response:", response.text)
    except Exception as e:
        print("Request failed:", e)

if __name__ == "__main__":
    test_safety_analysis()
