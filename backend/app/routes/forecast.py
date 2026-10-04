from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.app.db import get_city_by_id, search_cities, find_nearest_city
from pipeline.mock_forecast_generator import generate_72h_forecast

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

@router.get("")
def get_forecast(
    city_id: Optional[str] = Query(None, description="City ID like in_city_1 or world_1234"),
    city: Optional[str] = Query(None, description="City or village name"),
    state: Optional[str] = Query(None, description="State or province"),
    country: Optional[str] = Query(None, description="Country"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    population: Optional[int] = Query(None, description="Population")
):
    target_city = None

    if city_id and city_id.startswith("in_city_"):
        target_city = get_city_by_id(city_id)

    if not target_city:
        if lat is not None and lon is not None:
            target_city = {
                "id": city_id or f"coords_{lat:.2f}_{lon:.2f}",
                "city": city or f"Loc ({lat:.2f}, {lon:.2f})",
                "state": state or "",
                "country": country or "India",
                "lat": lat,
                "lon": lon,
                "population": population or 50000
            }
        elif city:
            matches = search_cities(city, limit=1)
            if matches:
                target_city = matches[0]
            else:
                target_city = {
                    "id": "custom",
                    "city": city.title(),
                    "state": state or "",
                    "country": country or "India",
                    "lat": 28.61,
                    "lon": 77.20,
                    "population": population or 50000
                }
        else:
            # Default to Delhi
            matches = search_cities("Delhi", limit=1)
            target_city = matches[0] if matches else {
                "id": "in_city_1",
                "city": "Delhi",
                "state": "Delhi",
                "country": "India",
                "lat": 28.6139,
                "lon": 77.2090,
                "population": 33000000
            }

    forecast_data = generate_72h_forecast(
        city_name=target_city["city"],
        lat=target_city["lat"],
        lon=target_city["lon"],
        state=target_city.get("state", ""),
        country=target_city.get("country", "India"),
        population=target_city.get("population", 50000)
    )
    forecast_data["city_id"] = target_city.get("id")

    return forecast_data
