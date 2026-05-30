def is_within_bbox(lat, lon, bbox):
    if not bbox:
        return False
    lat_ok = lat >= bbox['south'] and lat <= bbox['north']
    if bbox['west'] <= bbox['east']:
        lon_ok = lon >= bbox['west'] and lon <= bbox['east']
    else:
        lon_ok = lon >= bbox['west'] or lon <= bbox['east']
    return lat_ok and lon_ok

def run_tests():
    # London Bbox: south=51.2867601, north=51.6918741, west=-0.5103751, east=0.3340155
    london_bbox = {'south': 51.2867601, 'north': 51.6918741, 'west': -0.5103751, 'east': 0.3340155}
    
    # Coordinates inside London (e.g. Big Ben)
    inside_pt = (51.5007, -0.1245)
    # Coordinates outside London (e.g. Paris)
    outside_pt = (48.8566, 2.3522)
    
    assert is_within_bbox(inside_pt[0], inside_pt[1], london_bbox) == True, "Big Ben should be inside London bbox"
    assert is_within_bbox(outside_pt[0], outside_pt[1], london_bbox) == False, "Paris should be outside London bbox"
    
    print("Bbox tests passed successfully!")

if __name__ == "__main__":
    run_tests()
