from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.app.db import get_city_by_id, search_cities
from pipeline.mock_forecast_generator import generate_72h_forecast

router = APIRouter(prefix="/api/inversion", tags=["inversion"])

@router.get("")
def get_inversion(
    city_id: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None)
):
    if lat is not None and lon is not None:
        target_lat = lat
        target_lon = lon
        target_city = city or f"Location ({lat:.2f}, {lon:.2f})"
        target_state = state or ""
        target_country = country or "India"
    elif city_id and city_id.startswith("in_city_"):
        c = get_city_by_id(city_id)
        if c:
            target_lat = c["lat"]
            target_lon = c["lon"]
            target_city = c["city"]
            target_state = c["state"]
            target_country = "India"
        else:
            target_lat, target_lon, target_city, target_state, target_country = 28.61, 77.20, "Delhi", "Delhi", "India"
    elif city:
        matches = search_cities(city, limit=1)
        if matches:
            c = matches[0]
            target_lat, target_lon, target_city, target_state, target_country = c["lat"], c["lon"], c["city"], c["state"], "India"
        else:
            target_lat, target_lon, target_city, target_state, target_country = 28.61, 77.20, city, "", "India"
    else:
        target_lat, target_lon, target_city, target_state, target_country = 28.61, 77.20, "Delhi", "Delhi", "India"

    forecast = generate_72h_forecast(target_city, target_lat, target_lon, target_state, target_country)
    current = forecast["current"]

    return {
        "city": target_city,
        "state": target_state,
        "country": target_country,
        "coordinates": {"lat": target_lat, "lon": target_lon},
        "timestamp": current["time"],
        "inversion_detected": current["inversion_strength_c"] > 0.5,
        "inversion_strength_c": current["inversion_strength_c"],
        "inversion_base_m": current["inversion_base_m"],
        "pbl_height_m": current["pbl_height_m"],
        "ventilation_index_m2s": current["ventilation_index_m2s"],
        "trapping_risk": current["trapping_risk"],
        "atmospheric_stability": "Extremely Stable (Inversion Layer Active)" if current["inversion_strength_c"] > 2.0 else "Neutral / Weak Inversion",
        "hourly_inversion_series": [
            {
                "hour_index": h["hour_index"],
                "time": h["time"],
                "inversion_strength_c": h["inversion_strength_c"],
                "pbl_height_m": h["pbl_height_m"],
                "ventilation_index_m2s": h["ventilation_index_m2s"],
                "trapping_risk": h["trapping_risk"]
            }
            for h in forecast["hourly_coupled"]
        ]
    }
