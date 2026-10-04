"""
In-memory City Gazetteer and Station Database
Reads and indexes Indian cities from data/cities_india.csv
"""

import csv
import math
import os
from typing import Dict, List, Optional

CITIES_DB: List[Dict] = []
CITY_MAP_BY_ID: Dict[str, Dict] = {}

def load_cities_data():
    global CITIES_DB, CITY_MAP_BY_ID
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "cities_india.csv"))
    
    if not os.path.exists(csv_path):
        print(f"Warning: CSV file not found at {csv_path}")
        return

    CITIES_DB.clear()
    CITY_MAP_BY_ID.clear()

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        idx = 1
        for row in reader:
            city_id = f"in_city_{idx}"
            aliases = [a.strip() for a in row.get("aliases", "").split(",") if a.strip()]
            record = {
                "id": city_id,
                "city": row["city"].strip(),
                "state": row["state"].strip(),
                "lat": float(row["lat"]),
                "lon": float(row["lon"]),
                "tier": row.get("tier", "Tier-2").strip(),
                "population": int(row.get("population", 500000)),
                "aliases": aliases
            }
            CITIES_DB.append(record)
            CITY_MAP_BY_ID[city_id] = record
            idx += 1
            
    print(f"Loaded {len(CITIES_DB)} cities into AeroSync Gazetteer.")

def search_cities(query: str, limit: int = 10) -> List[Dict]:
    """Search cities by name, state, or alias with fuzzy/prefix matching."""
    if not query:
        return CITIES_DB[:limit]
        
    q = query.lower().strip()
    exact_matches = []
    prefix_matches = []
    contains_matches = []

    for c in CITIES_DB:
        c_name = c["city"].lower()
        c_state = c["state"].lower()
        c_aliases = [a.lower() for a in c["aliases"]]

        if c_name == q:
            exact_matches.append(c)
        elif c_name.startswith(q) or any(a.startswith(q) for a in c_aliases):
            prefix_matches.append(c)
        elif q in c_name or q in c_state or any(q in a for a in c_aliases):
            contains_matches.append(c)

    results = exact_matches + prefix_matches + contains_matches
    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for r in results:
        if r["id"] not in seen:
            seen.add(r["id"])
            deduped.append(r)
        if len(deduped) >= limit:
            break
    return deduped

def get_city_by_id(city_id: str) -> Optional[Dict]:
    return CITY_MAP_BY_ID.get(city_id)

def find_nearest_city(lat: float, lon: float) -> Optional[Dict]:
    """Find the nearest city to coordinates using Euclidean distance."""
    if not CITIES_DB:
        return None
    
    nearest = None
    min_dist = float("inf")
    for c in CITIES_DB:
        dlat = lat - c["lat"]
        dlon = (lon - c["lon"]) * math.cos(math.radians(lat))
        dist = math.sqrt(dlat**2 + dlon**2)
        if dist < min_dist:
            min_dist = dist
            nearest = c
    return nearest

# Load initially
load_cities_data()
