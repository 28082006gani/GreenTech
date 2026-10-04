"""
AeroSync India - Atmospheric Boundary Layer & Inversion Metrics
Calculates:
- Temperature Inversion Strength (°C): continuous layer temperature increase (T_top - T_base)
- Inversion Base Height (m agl)
- Inversion Top Height (m agl)
- Planetary Boundary Layer (PBL) Height (m agl)
- Ventilation Index (m²/s) = PBL Height × Wind Speed
- Atmospheric Trapping Risk Level (Low, Moderate, High, Severe)
"""

from typing import Dict, List, Optional

def compute_inversion_metrics(
    temperature_profile: List[Dict[str, float]], 
    pbl_height_m: float, 
    mean_wind_speed_mps: float
) -> Dict:
    """
    Given a vertical sounding profile:
    temperature_profile: list of {'height_m': z, 'temp_c': t} sorted by height ascending up to 2000m
    """
    if not temperature_profile:
        vent_index = round(pbl_height_m * mean_wind_speed_mps, 1)
        return {
            "inversion_detected": False,
            "inversion_strength_c": 0.0,
            "inversion_base_m": 0,
            "inversion_top_m": 0,
            "pbl_height_m": round(pbl_height_m),
            "mean_wind_speed_mps": round(mean_wind_speed_mps, 1),
            "ventilation_index_m2s": vent_index,
            "trapping_risk": "Low",
            "summary": "Normal atmospheric lapse rate with open boundary mixing."
        }

    # Filter to lowest 1500 meters agl
    valid_levels = [lvl for lvl in temperature_profile if lvl["height_m"] <= 1500]
    
    max_inversion_dt = 0.0
    best_base = 0.0
    best_top = 0.0
    inversion_active = False

    # Meteorological multi-level layer scanning:
    # Scan every potential base height and find its maximum temperature peak above it
    for i in range(len(valid_levels) - 1):
        z_base = valid_levels[i]["height_m"]
        t_base = valid_levels[i]["temp_c"]

        for j in range(i + 1, len(valid_levels)):
            z_top = valid_levels[j]["height_m"]
            t_top = valid_levels[j]["temp_c"]

            layer_dt = t_top - t_base
            if layer_dt > 0:
                inversion_active = True
                if layer_dt > max_inversion_dt:
                    max_inversion_dt = layer_dt
                    best_base = z_base
                    best_top = z_top

    vent_index = round(pbl_height_m * mean_wind_speed_mps, 1)

    # Classify Trapping Risk based on CPCB/IMD criteria:
    if vent_index < 2000 and max_inversion_dt >= 3.0:
        risk = "Severe"
        desc = "Severe atmospheric stagnation. High inversion lid trapping all surface emissions near ground level."
    elif vent_index < 3500 or max_inversion_dt >= 2.0:
        risk = "High"
        desc = "Strong thermal cap with poor boundary ventilation. Particulates accumulate rapidly."
    elif vent_index < 6000 or max_inversion_dt >= 0.8:
        risk = "Moderate"
        desc = "Moderate thermal restriction. Slow pollutant dispersion during early morning hours."
    else:
        risk = "Low"
        desc = "Good ventilation and deep planetary boundary layer. Pollutants disperse effectively."

    return {
        "inversion_detected": inversion_active,
        "inversion_strength_c": round(max_inversion_dt, 2),
        "inversion_base_m": round(best_base),
        "inversion_top_m": round(best_top),
        "pbl_height_m": round(pbl_height_m),
        "mean_wind_speed_mps": round(mean_wind_speed_mps, 1),
        "ventilation_index_m2s": vent_index,
        "trapping_risk": risk,
        "summary": desc
    }
