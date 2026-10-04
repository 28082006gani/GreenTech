"""
CPCB (Central Pollution Control Board) India AQI Calculator
Implements official Indian National Air Quality Index (NAQI) sub-index formulas:
I = I_low + ((I_high - I_low) / (C_high - C_low)) * (C - C_low)
Fixed: Continuous closed intervals to eliminate numerical gap errors.
"""

from typing import Dict, Optional, Tuple

# CPCB Continuous Breakpoints: (C_low, C_high, I_low, I_high)
# Boundaries are continuous to prevent gaps between integer/float ranges.
BREAKPOINTS = {
    "pm25": [
        (0.0, 30.0, 0, 50),
        (30.0, 60.0, 51, 100),
        (60.0, 90.0, 101, 200),
        (90.0, 120.0, 201, 300),
        (120.0, 250.0, 301, 400),
        (250.0, 500.0, 401, 500),
    ],
    "pm10": [
        (0.0, 50.0, 0, 50),
        (50.0, 100.0, 51, 100),
        (100.0, 250.0, 101, 200),
        (250.0, 350.0, 201, 300),
        (350.0, 430.0, 301, 400),
        (430.0, 600.0, 401, 500),
    ],
    "no2": [
        (0.0, 40.0, 0, 50),
        (40.0, 80.0, 51, 100),
        (80.0, 180.0, 101, 200),
        (180.0, 280.0, 201, 300),
        (280.0, 400.0, 301, 400),
        (400.0, 800.0, 401, 500),
    ],
    "o3": [
        (0.0, 50.0, 0, 50),
        (50.0, 100.0, 51, 100),
        (100.0, 168.0, 101, 200),
        (168.0, 208.0, 201, 300),
        (208.0, 748.0, 301, 400),
        (748.0, 1000.0, 401, 500),
    ],
    "so2": [
        (0.0, 40.0, 0, 50),
        (40.0, 80.0, 51, 100),
        (80.0, 380.0, 101, 200),
        (380.0, 800.0, 201, 300),
        (800.0, 1600.0, 301, 400),
        (1600.0, 2000.0, 401, 500),
    ],
    "co": [
        (0.0, 1.0, 0, 50),
        (1.0, 2.0, 51, 100),
        (2.0, 10.0, 101, 200),
        (10.0, 17.0, 201, 300),
        (17.0, 34.0, 301, 400),
        (34.0, 50.0, 401, 500),
    ],
}

CATEGORIES = [
    (0, 50, "Good", "#00b050", "Minimal impact. Clean, fresh air."),
    (51, 100, "Satisfactory", "#92d050", "Minor breathing discomfort to sensitive people."),
    (101, 200, "Moderate", "#ffff00", "Breathing discomfort to the people with lungs, asthma and heart diseases."),
    (201, 300, "Poor", "#ff9900", "Breathing discomfort to most people on prolonged exposure."),
    (301, 400, "Very Poor", "#ff0000", "Respiratory illness on prolonged exposure. Avoid strenuous outdoor activity."),
    (401, 500, "Severe", "#7030a0", "Affects healthy people and seriously impacts those with existing diseases. Stay indoors."),
]

def calculate_sub_index(pollutant: str, concentration: float) -> Optional[int]:
    """Calculate sub-index for a single pollutant based on continuous CPCB breakpoints."""
    if concentration is None or concentration < 0:
        return None
    
    pollutant_lower = pollutant.lower()
    if pollutant_lower not in BREAKPOINTS:
        return None
    
    ranges = BREAKPOINTS[pollutant_lower]
    for c_low, c_high, i_low, i_high in ranges:
        if c_low <= concentration <= c_high:
            sub = i_low + ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low)
            return round(sub)
    
    # If above max range, clamp to 500
    if concentration > ranges[-1][1]:
        return 500
    return 0

def get_aqi_category(aqi_value: int) -> Dict[str, str]:
    """Retrieve CPCB category, color code, and health advisory."""
    for low, high, category, color, advisory in CATEGORIES:
        if low <= aqi_value <= high:
            return {
                "category": category,
                "color": color,
                "advisory": advisory,
                "aqi": aqi_value
            }
    if aqi_value > 500:
        return {
            "category": "Severe+",
            "color": "#4a0072",
            "advisory": "Emergency air quality conditions. Mask mandatory, purify indoor air.",
            "aqi": aqi_value
        }
    return {
        "category": "Good",
        "color": "#00b050",
        "advisory": "Minimal impact.",
        "aqi": 0
    }

def calculate_overall_aqi(pollutants: Dict[str, float]) -> Dict:
    """
    Calculate composite AQI according to CPCB norms:
    Overall AQI is the maximum of the sub-indices.
    Verifies pollutant presence and calculates dominant component.
    """
    sub_indices = {}
    for pol, val in pollutants.items():
        sub = calculate_sub_index(pol, val)
        if sub is not None:
            sub_indices[pol] = sub
            
    if not sub_indices:
        return {
            "aqi": 0, 
            "dominant_pollutant": "None", 
            "category": "Unknown", 
            "color": "#888888", 
            "sub_indices": {},
            "cpcb_compliant": False
        }
        
    dominant = max(sub_indices, key=sub_indices.get)
    overall_val = sub_indices[dominant]
    cat_info = get_aqi_category(overall_val)
    
    # Check official CPCB validity: at least 3 pollutants, including PM2.5 or PM10
    has_particulate = "pm25" in sub_indices or "pm10" in sub_indices
    is_compliant = len(sub_indices) >= 3 and has_particulate
    
    return {
        "aqi": overall_val,
        "dominant_pollutant": dominant.upper(),
        "category": cat_info["category"],
        "color": cat_info["color"],
        "advisory": cat_info["advisory"],
        "sub_indices": sub_indices,
        "cpcb_compliant": is_compliant
    }
