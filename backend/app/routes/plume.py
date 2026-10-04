from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.app.db import get_city_by_id, search_cities
from backend.app.routes.fires import CACHED_FIRES
from pipeline.fetch_firms import calculate_plume_trajectory

router = APIRouter(prefix="/api/plume", tags=["plume"])

@router.get("")
def get_plume(
    city_id: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    country: Optional[str] = Query("India")
):
    if lat is not None and lon is not None:
        target_lat = lat
        target_lon = lon
        target_city = city or f"Loc ({lat:.2f}, {lon:.2f})"
        target_state = ""
    elif city_id and city_id.startswith("in_city_"):
        c = get_city_by_id(city_id)
        if c:
            target_lat, target_lon, target_city, target_state = c["lat"], c["lon"], c["city"], c["state"]
        else:
            target_lat, target_lon, target_city, target_state = 28.61, 77.20, "Delhi", "Delhi"
    elif city:
        matches = search_cities(city, limit=1)
        if matches:
            c = matches[0]
            target_lat, target_lon, target_city, target_state = c["lat"], c["lon"], c["city"], c["state"]
        else:
            target_lat, target_lon, target_city, target_state = 28.61, 77.20, city, ""
    else:
        target_lat, target_lon, target_city, target_state = 28.61, 77.20, "Delhi", "Delhi"

    plume_info = calculate_plume_trajectory(
        city_lat=target_lat,
        city_lon=target_lon,
        fires=CACHED_FIRES
    )

    return {
        "city": target_city,
        "state": target_state,
        "country": country,
        "coordinates": {"lat": target_lat, "lon": target_lon},
        "plume_metrics": plume_info
    }
