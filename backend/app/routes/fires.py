from fastapi import APIRouter, Query
from typing import Optional
from pipeline.fetch_firms import generate_sample_firms_detections

router = APIRouter(prefix="/api/fires", tags=["fires"])

# Persistent sample for the session so it doesn't jump randomly on every single fetch
CACHED_FIRES = generate_sample_firms_detections(160)

@router.get("")
def get_fires(hours: int = Query(24, description="Lookback window in hours")):
    features = []
    for f in CACHED_FIRES:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [f["lon"], f["lat"]]
            },
            "properties": {
                "id": f["id"],
                "frp_mw": f["frp_mw"],
                "confidence": f["confidence"],
                "instrument": f["instrument"],
                "region": f["region"],
                "acq_time": f["acq_time"],
                "emission_rate_kgs": f["pm25_emission_rate_kgs"]
            }
        })

    return {
        "type": "FeatureCollection",
        "total_active_fires": len(CACHED_FIRES),
        "source": "NASA FIRMS (VIIRS S-NPP / NOAA-20 & MODIS)",
        "features": features
    }
