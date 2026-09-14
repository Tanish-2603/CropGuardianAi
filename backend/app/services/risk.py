import math
from typing import Dict, Any, List, Tuple

def calculate_weather_risk(
    temperature: float,
    humidity: float,
    precipitation_24h_mm: float,
    rain_probability: float,
    high_hum_hours: int = 8
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Computes environmental disease pressure index (0 to 100).
    Fungal spores (Alternaria, Phytophthora) germinate when leaf moisture >90% or relative humidity >80%
    at temperatures between 18C and 28C.
    """
    drivers = []
    
    # Humidity component (0 - 45 pts)
    # Optimal sporulation humidity is > 80%
    if humidity >= 85.0:
        hum_score = 42.0 + min(3.0, (humidity - 85.0) * 0.2)
        drivers.append({
            "factor": "High Atmospheric Humidity",
            "contribution": round(hum_score, 1),
            "explanation": f"Sustained relative humidity of {humidity:.1f}% creates a prolonged moisture film on leaves necessary for spore germination."
        })
    elif humidity >= 70.0:
        hum_score = 25.0 + (humidity - 70.0) * 1.1
        drivers.append({
            "factor": "Elevated Humidity",
            "contribution": round(hum_score, 1),
            "explanation": f"Relative humidity at {humidity:.1f}% presents moderate disease incubation conditions."
        })
    else:
        hum_score = max(5.0, humidity * 0.3)

    # Rain / Precipitation component (0 - 35 pts)
    if precipitation_24h_mm >= 15.0 or rain_probability >= 80.0:
        rain_score = 35.0
        drivers.append({
            "factor": "Heavy Rain & Soil Saturation",
            "contribution": round(rain_score, 1),
            "explanation": f"Forecasted {precipitation_24h_mm:.1f}mm rainfall with {rain_probability:.0f}% probability will splash soil pathogens onto lower foliage."
        })
    elif precipitation_24h_mm >= 4.0 or rain_probability >= 50.0:
        rain_score = 20.0 + min(12.0, precipitation_24h_mm * 1.5)
        drivers.append({
            "factor": "Rain Expected",
            "contribution": round(rain_score, 1),
            "explanation": f"Anticipated precipitation ({precipitation_24h_mm:.1f}mm) promotes leaf surface wetness."
        })
    else:
        rain_score = min(10.0, precipitation_24h_mm * 2.0 + rain_probability * 0.1)

    # Temperature affinity multiplier (0 - 20 pts)
    # Fungal pathogen sweet spot: 18 - 28C
    if 18.0 <= temperature <= 28.0:
        temp_score = 20.0
        drivers.append({
            "factor": "Pathogen-Favorable Temperature",
            "contribution": round(temp_score, 1),
            "explanation": f"Ambient temperature of {temperature:.1f}°C falls squarely in the active vegetative reproduction window for tomato pathogens."
        })
    elif 14.0 <= temperature < 18.0 or 28.0 < temperature <= 34.0:
        temp_score = 12.0
    else:
        # Extreme cold or heat dampens fungal risk
        temp_score = 4.0

    total_weather_risk = min(100.0, hum_score + rain_score + temp_score)
    return round(total_weather_risk, 1), drivers

def calculate_field_risk(
    crop_stage: str,
    irrigation: str,
    drainage: str,
    soil_type: str = "Loamy"
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Computes field susceptibility risk (0 to 100) based on agronomic context.
    """
    drivers = []
    score = 20.0 # baseline

    # Stage susceptibility: Flowering and Fruiting are highest impact
    stage_lower = crop_stage.lower()
    if "fruit" in stage_lower:
        score += 30.0
        drivers.append({
            "factor": "Fruiting Stage Vulnerability",
            "contribution": 30.0,
            "explanation": "Plant canopy density is dense, restricting internal airflow and increasing blossom-end and fruit rot vulnerability."
        })
    elif "flower" in stage_lower:
        score += 24.0
        drivers.append({
            "factor": "Flowering Stage Sensitivity",
            "contribution": 24.0,
            "explanation": "Active flower set and canopy expansion makes plants sensitive to leaf drop from fungal blight."
        })
    elif "vegetative" in stage_lower:
        score += 15.0
    else:
        score += 10.0

    # Irrigation impact
    irrig_lower = irrigation.lower()
    if "sprinkler" in irrig_lower or "overhead" in irrig_lower:
        score += 25.0
        drivers.append({
            "factor": "Overhead Irrigation Practice",
            "contribution": 25.0,
            "explanation": "Sprinkler/overhead watering wets upper and lower canopy foliage directly, extending leaf wetness duration."
        })
    elif "furrow" in irrig_lower:
        score += 12.0
    else:
        score += 4.0 # Drip is best practice

    # Drainage impact
    drain_lower = drainage.lower()
    if "poor" in drain_lower:
        score += 25.0
        drivers.append({
            "factor": "Poor Field Drainage",
            "contribution": 25.0,
            "explanation": "Inadequate furrow drainage creates stagnant puddles and high microclimate humidity around lower leaves."
        })
    elif "moderate" in drain_lower:
        score += 12.0
    else:
        score += 2.0 # Good drainage

    total_field_risk = min(100.0, score)
    return round(total_field_risk, 1), drivers

def fuse_crop_risk(
    visual_risk: float,
    weather_risk: float,
    field_risk: float,
    visual_drivers: List[Dict[str, Any]],
    weather_drivers: List[Dict[str, Any]],
    field_drivers: List[Dict[str, Any]],
    outlook_weather_days: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Section 11 Prototype Risk Formula:
    Risk = 0.45 * visual_risk + 0.35 * weather_risk + 0.20 * field_risk
    Clamped 0 - 100.
    """
    raw_risk = 0.45 * visual_risk + 0.35 * weather_risk + 0.20 * field_risk
    clamped_risk = round(max(0.0, min(100.0, raw_risk)), 1)

    # Categorize Risk Level (Section 35)
    if clamped_risk >= 70.0:
        risk_level = "HIGH"
    elif clamped_risk >= 40.0:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    # Consolidate and rank top risk drivers
    all_drivers = []
    
    # Add visual evidence driver if meaningful
    if visual_risk > 35.0:
        all_drivers.append({
            "factor": "Leaf Diagnostic Lesion Evidence",
            "contribution": round(visual_risk * 0.45, 1),
            "explanation": "Computer vision identified characteristic necrotic lesions/chlorotic patches on foliage."
        })
    elif visual_risk < 15.0:
        all_drivers.append({
            "factor": "Healthy Foliage Baseline",
            "contribution": round(visual_risk * 0.45, 1),
            "explanation": "Primary leaf tissue exhibits robust chlorophyll index with minimal visible damage."
        })

    all_drivers.extend(weather_drivers)
    all_drivers.extend(field_drivers)

    # Sort drivers by contribution descending
    all_drivers.sort(key=lambda d: d.get("contribution", 0.0), reverse=True)
    top_driver_names = [d["factor"] for d in all_drivers[:3]]

    # Compute 72-hour outlook progression
    # Section 13: Killer Demo scenario shows progression over +24h, +48h, +72h
    outlook_72h = []
    if not outlook_weather_days:
        # Generate default progression
        labels = ["Today", "+24h", "+48h", "+72h"]
        offsets = [0, 24, 48, 72]
        multipliers = [1.0, 1.15, 1.25, 1.18] if weather_risk > 60 else [1.0, 1.05, 1.02, 0.95]
        
        for i, lbl in enumerate(labels):
            p_score = min(100.0, round(clamped_risk * multipliers[i], 1))
            lvl = "HIGH" if p_score >= 70.0 else "MODERATE" if p_score >= 40.0 else "LOW"
            outlook_72h.append({
                "day_label": lbl,
                "hours_from_now": offsets[i],
                "risk_score": p_score,
                "risk_level": lvl,
                "temperature": 25.0,
                "humidity": 82.0,
                "rain_mm": 8.0 if i < 2 else 1.0,
                "rain_probability": 75.0 if i < 2 else 30.0,
                "condition_summary": "High disease pressure window" if lvl == "HIGH" else "Moderate humidity"
            })
    else:
        for day in outlook_weather_days:
            # Recompute environmental subscore for that day
            day_w_risk, _ = calculate_weather_risk(
                temperature=day["temperature"],
                humidity=day["humidity"],
                precipitation_24h_mm=day["rain_mm"],
                rain_probability=day["rain_probability"]
            )
            # If visual risk is mild, but weather is high, disease pressure compounds over time!
            # Day cumulative factor
            day_factor = 1.0 + (day["hours_from_now"] / 72.0) * (0.25 if day_w_risk > 65 else -0.10)
            compounded_visual = min(100.0, visual_risk * day_factor)
            day_risk_score = round(min(100.0, max(0.0, 0.45 * compounded_visual + 0.35 * day_w_risk + 0.20 * field_risk)), 1)
            day_level = "HIGH" if day_risk_score >= 70.0 else "MODERATE" if day_risk_score >= 40.0 else "LOW"

            outlook_72h.append({
                "day_label": day["day_label"],
                "hours_from_now": day["hours_from_now"],
                "risk_score": day_risk_score,
                "risk_level": day_level,
                "temperature": day["temperature"],
                "humidity": day["humidity"],
                "rain_mm": day["rain_mm"],
                "rain_probability": day["rain_probability"],
                "condition_summary": day["condition_summary"]
            })

    return {
        "risk_score": clamped_risk,
        "risk_level": risk_level,
        "subscores": {
            "visual_risk": round(visual_risk, 1),
            "weather_risk": round(weather_risk, 1),
            "field_risk": round(field_risk, 1)
        },
        "drivers": top_driver_names,
        "risk_factors": all_drivers[:4],
        "outlook_72h": outlook_72h
    }
