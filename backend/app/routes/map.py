from fastapi import APIRouter
from backend.app.db import CITIES_DB
from pipeline.mock_forecast_generator import generate_72h_forecast

router = APIRouter(prefix="/api/map", tags=["map"])

# Pre-generate station data for fast map loading
STATIONS_CACHE = []

def initialize_stations_map():
    global STATIONS_CACHE
    stations = []
    # Pick a solid cross section of major cities across India
    for c in CITIES_DB:
        # Generate quick current reading
        forecast = generate_72h_forecast(c["city"], c["lat"], c["lon"], c["state"])
        curr = forecast["current"]
        stations.append({
            "id": c["id"],
            "city": c["city"],
            "state": c["state"],
            "lat": c["lat"],
            "lon": c["lon"],
            "tier": c["tier"],
            "aqi": curr["aqi"],
            "category": curr["category"],
            "color": curr["color"],
            "dominant": curr["dominant"],
            "pm25": curr["pm25"],
            "pm10": curr["pm10"],
            "temp_c": curr["temp_c"],
            "humidity_pct": curr["humidity_pct"],
            "wind_speed_mps": curr["wind_speed_mps"],
            "inversion_strength_c": curr["inversion_strength_c"],
            "trapping_risk": curr["trapping_risk"]
        })
    STATIONS_CACHE = stations

initialize_stations_map()

@router.get("/stations")
def get_map_stations():
    return {
        "count": len(STATIONS_CACHE),
        "stations": STATIONS_CACHE
    }

@router.get("/aqi-geojson")
def get_stations_geojson():
    features = []
    for s in STATIONS_CACHE:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [s["lon"], s["lat"]]
            },
            "properties": s
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }
