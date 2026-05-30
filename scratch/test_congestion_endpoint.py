import requests
import json

def test_endpoint():
    url = "http://localhost:8000/api/client/congestion-report"
    print("Testing GET /api/client/congestion-report...")
    
    # Test default params
    r = requests.get(url)
    print(f"Status Code: {r.status_code}")
    assert r.status_code == 200, "Should return 200"
    data = r.json()
    print("Default Response structure:")
    print(json.dumps(data, indent=2)[:500])
    
    assert "status" in data
    assert "summary" in data
    assert "bar_chart" in data
    assert "line_chart" in data
    assert "corridors" in data
    
    summary = data["summary"]
    assert "total_flags" in summary
    assert "peak_day" in summary
    assert "worst_hour" in summary
    assert "am_ratio" in summary
    assert "pm_ratio" in summary
    
    # Test specific city
    r_lahore = requests.get(f"{url}?city=Lahore")
    assert r_lahore.status_code == 200
    lahore_data = r_lahore.json()
    print(f"Lahore total flags: {lahore_data['summary']['total_flags']}")
    
    # Test specific corridor
    if lahore_data["corridors"]:
        corr = lahore_data["corridors"][0]
        r_corr = requests.get(f"{url}?city=Lahore&corridor={corr}")
        assert r_corr.status_code == 200
        corr_data = r_corr.json()
        print(f"Lahore corridor '{corr}' flags: {corr_data['summary']['total_flags']}")
        
    print("All backend checks passed successfully!")

if __name__ == "__main__":
    test_endpoint()
