from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import urllib.request
import json
import urllib.parse
from backend.app.db import search_cities, get_city_by_id, find_nearest_city, CITIES_DB

router = APIRouter(prefix="/api/cities", tags=["cities"])

GEOCODE_CACHE = {}

def fetch_worldwide_geocoding(query: str, limit: int = 10) -> List[dict]:
    """Query Open-Meteo worldwide geocoding engine covering every village, town, and city globally."""
    q_clean = query.strip()
    if not q_clean or len(q_clean) < 2:
        return []
    
    cache_key = f"{q_clean.lower()}_{limit}"
    if cache_key in GEOCODE_CACHE:
        return GEOCODE_CACHE[cache_key]

    try:
        encoded_q = urllib.parse.quote(q_clean)
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_q}&count={limit}&language=en&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "AeroSync-Worldwide/1.0"})
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results = data.get("results", [])
            
            formatted = []
            for item in results:
                feature_code = item.get("feature_code", "")
                place_type = "City"
                pop = item.get("population", 0) or 0
                if "PPLX" in feature_code or ("PPL" in feature_code and pop < 5000):
                    place_type = "Village"
                elif "PPLA2" in feature_code or "PPLA3" in feature_code or (pop < 100000 and pop >= 5000):
                    place_type = "Town"
                elif "PPLC" in feature_code:
                    place_type = "Capital"

                formatted.append({
                    "id": f"world_{item.get('id')}",
                    "city": item.get("name"),
                    "state": item.get("admin1", item.get("admin2", "")),
                    "country": item.get("country", ""),
                    "country_code": item.get("country_code", ""),
                    "lat": round(float(item.get("latitude")), 4),
                    "lon": round(float(item.get("longitude")), 4),
                    "population": pop,
                    "place_type": place_type,
                    "timezone": item.get("timezone", "UTC"),
                    "elevation": item.get("elevation", 0),
                    "is_global": True
                })

            GEOCODE_CACHE[cache_key] = formatted
            return formatted
    except Exception as e:
        # Safe ASCII log to avoid Windows cp1252 crash
        print(f"Worldwide geocoding fetch error: {str(e).encode('ascii', 'replace').decode('ascii')}")
        return []

@router.get("/search")
def search(q: str = Query("", description="Search any village, town, or city in the world"), limit: int = 12):
    if not q.strip():
        return {
            "query": q,
            "count": len(CITIES_DB[:limit]),
            "results": [dict(c, country="India", country_code="IN", is_global=False) for c in CITIES_DB[:limit]]
        }

    # Shallow copy to avoid mutating in-memory CITIES_DB objects
    local_matches = [
        dict(
            l,
            country="India",
            country_code="IN",
            place_type="City" if l.get("tier") in ["Tier-1", "Tier-2"] else "Town",
            is_global=False
        )
        for l in search_cities(q, limit=limit)
    ]

    # Fetch worldwide places
    world_matches = fetch_worldwide_geocoding(q, limit=limit)

    seen_coords = set()
    combined = []

    # Prioritize local matches
    for loc in local_matches:
        key = f"{round(loc['lat'], 2)}_{round(loc['lon'], 2)}"
        seen_coords.add(key)
        combined.append(loc)

    # Add worldwide results
    for loc in world_matches:
        key = f"{round(loc['lat'], 2)}_{round(loc['lon'], 2)}"
        if key not in seen_coords:
            seen_coords.add(key)
            combined.append(loc)

    return {
        "query": q,
        "count": len(combined[:limit]),
        "results": combined[:limit]
    }

@router.get("/reverse")
def reverse_geocode(lat: float = Query(...), lon: float = Query(...)):
    """Multi-tier reverse geocode coordinates to find village, town, or city."""
    # Tier 1: Local proximity check
    nearest = find_nearest_city(lat, lon)
    if nearest:
        import math
        dlat = lat - nearest["lat"]
        dlon = (lon - nearest["lon"]) * math.cos(math.radians(lat))
        dist_km = math.sqrt(dlat**2 + dlon**2) * 111.0
        if dist_km < 12.0:
            return {
                "city": nearest["city"],
                "state": nearest["state"],
                "country": "India",
                "country_code": "IN",
                "lat": lat,
                "lon": lon,
                "place_type": "Town / City",
                "display_name": f"{nearest['city']}, {nearest['state']}, India"
            }

    # Tier 2: OpenStreetMap Nominatim
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "AeroSync-Worldwide/1.0 (contact@aerosync.org)"})
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            addr = data.get("address", {})
            place_name = (
                addr.get("village") or
                addr.get("town") or
                addr.get("hamlet") or
                addr.get("suburb") or
                addr.get("city") or
                addr.get("county") or
                data.get("name") or
                "Detected Location"
            )
            state_name = addr.get("state") or addr.get("region") or ""
            country_name = addr.get("country") or "India"
            country_code = addr.get("country_code", "IN").upper()

            return {
                "city": place_name,
                "state": state_name,
                "country": country_name,
                "country_code": country_code,
                "lat": lat,
                "lon": lon,
                "place_type": "Village / Locality",
                "display_name": data.get("display_name", f"{place_name}, {state_name}, {country_name}")
            }
    except Exception as e:
        pass

    # Tier 3: BigDataCloud fallback
    try:
        url_bdc = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
        req_bdc = urllib.request.Request(url_bdc, headers={"User-Agent": "AeroSync/1.0"})
        with urllib.request.urlopen(req_bdc, timeout=3.0) as resp:
            data_bdc = json.loads(resp.read().decode("utf-8"))
            city_bdc = data_bdc.get("locality") or data_bdc.get("city") or "Nearby Place"
            state_bdc = data_bdc.get("principalSubdivision") or ""
            country_bdc = data_bdc.get("countryName") or "Global"
            return {
                "city": city_bdc,
                "state": state_bdc,
                "country": country_bdc,
                "country_code": data_bdc.get("countryCode", ""),
                "lat": lat,
                "lon": lon,
                "place_type": "Locality",
                "display_name": f"{city_bdc}, {state_bdc}, {country_bdc}"
            }
    except Exception:
        pass

    # Tier 4: Final coordinate fallback
    return {
        "city": f"Location ({lat:.2f}, {lon:.2f})",
        "state": "Local Area",
        "country": "India" if (8.0 <= lat <= 37.0 and 68.0 <= lon <= 97.0) else "Global",
        "country_code": "IN" if (8.0 <= lat <= 37.0 and 68.0 <= lon <= 97.0) else "",
        "lat": lat,
        "lon": lon,
        "place_type": "Coordinates",
        "display_name": f"Coordinates ({lat:.4f}, {lon:.4f})"
    }

@router.get("/all")
def get_all():
    return {"total": len(CITIES_DB), "cities": CITIES_DB}

@router.get("/{city_id}")
def get_city(city_id: str):
    city = get_city_by_id(city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city
