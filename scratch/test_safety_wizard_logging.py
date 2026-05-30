import requests
import json

def test_safety_wizard():
    url = "http://localhost:8000/api/routes/safety-wizard"
    payload = {
        "city": "Lahore",
        "source": "Gulberg",
        "destination": "Mall Road",
        "timestamp": "2026-05-30T09:00:00Z"
    }
    print("Calling /api/routes/safety-wizard...")
    r = requests.post(url, json=payload)
    print(f"Status Code: {r.status_code}")
    assert r.status_code == 200
    res = r.json()
    print("Provider used:", res.get("provider"))
    
    # Now check if a hazard event was logged
    report_url = "http://localhost:8000/api/client/congestion-report?city=Lahore&week_start=2026-05-25"
    r_report = requests.get(report_url)
    assert r_report.status_code == 200
    report_data = r_report.json()
    print("Total flags in Lahore for week of 2026-05-25:", report_data["summary"]["total_flags"])
    print("Corridors in Lahore:", report_data["corridors"])
    
    # Assert "Gulberg - Mall Road" is in corridors
    assert "Gulberg - Mall Road" in report_data["corridors"], "Should have logged Gulberg - Mall Road corridor"
    print("Safety wizard logging test passed successfully!")

if __name__ == "__main__":
    test_safety_wizard()
