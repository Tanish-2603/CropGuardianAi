import httpx
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

async def fetch_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Queries Open-Meteo API for real-time and 72-hour forecast data.
    Gracefully falls back to realistic simulated weather if the service is unreachable.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m",
        "forecast_days": 4,
        "timezone": "auto"
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get(OPEN_METEO_URL, params=params)
            if response.status_code == 200:
                raw = response.json()
                return process_open_meteo_response(raw)
            else:
                logger.warning(f"Open-Meteo returned status {response.status_code}, using simulated fallback.")
                return get_fallback_weather(latitude, longitude)
    except Exception as e:
        logger.warning(f"Failed to reach Open-Meteo API ({e}), using simulated fallback.")
        return get_fallback_weather(latitude, longitude)

def process_open_meteo_response(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts engineered features from raw Open-Meteo response.
    """
    current = raw.get("current", {})
    hourly = raw.get("hourly", {})

    temp_curr = current.get("temperature_2m", 24.5)
    hum_curr = current.get("relative_humidity_2m", 78.0)
    rain_curr = current.get("precipitation", 0.0)
    wind_curr = current.get("wind_speed_10m", 6.5)

    hourly_temp: List[float] = hourly.get("temperature_2m", [temp_curr] * 96)
    hourly_hum: List[float] = hourly.get("relative_humidity_2m", [hum_curr] * 96)
    hourly_precip: List[float] = hourly.get("precipitation", [0.0] * 96)
    hourly_prob: List[float] = hourly.get("precipitation_probability", [20.0] * 96)
    hourly_wind: List[float] = hourly.get("wind_speed_10m", [wind_curr] * 96)

    # Next 24 hours window
    next_24_temp = hourly_temp[:24] if len(hourly_temp) >= 24 else [temp_curr]
    next_24_hum = hourly_hum[:24] if len(hourly_hum) >= 24 else [hum_curr]
    next_24_rain = hourly_precip[:24] if len(hourly_precip) >= 24 else [rain_curr]
    next_24_prob = hourly_prob[:24] if len(hourly_prob) >= 24 else [20.0]

    # Next 72 hours window
    next_72_rain = hourly_precip[:72] if len(hourly_precip) >= 72 else next_24_rain

    mean_temp_24h = sum(next_24_temp) / max(len(next_24_temp), 1)
    max_temp_24h = max(next_24_temp) if next_24_temp else temp_curr
    mean_hum_24h = sum(next_24_hum) / max(len(next_24_hum), 1)
    high_hum_hours_24h = sum(1 for h in next_24_hum if h >= 80.0)
    total_rain_24h = sum(next_24_rain)
    total_rain_72h = sum(next_72_rain)
    max_rain_prob_24h = max(next_24_prob) if next_24_prob else 10.0
    mean_wind = sum(hourly_wind[:24]) / max(len(hourly_wind[:24]), 1)

    # Wetness proxy: high humidity (>75%) + rain + moderate temp (18-28C) creates fungal sporulation conditions
    temp_factor = 1.0 if 18.0 <= mean_temp_24h <= 30.0 else 0.6
    wetness_proxy = min(100.0, (mean_hum_24h * 0.5 + min(total_rain_24h * 4.0, 40.0) + (high_hum_hours_24h * 1.5)) * temp_factor)

    forecast_trend = "Rain expected within 24h" if total_rain_24h > 2.0 else "Prolonged leaf moisture" if high_hum_hours_24h > 10 else "Favorable drying conditions"

    # Daily breakdown for 72-hour outlook
    outlook_days = []
    labels = ["Today", "+24h", "+48h", "+72h"]
    for i in range(4):
        start = i * 24
        end = start + 24
        d_temp = hourly_temp[start:end] if len(hourly_temp) >= end else [temp_curr]
        d_hum = hourly_hum[start:end] if len(hourly_hum) >= end else [hum_curr]
        d_rain = hourly_precip[start:end] if len(hourly_precip) >= end else [0.0]
        d_prob = hourly_prob[start:end] if len(hourly_prob) >= end else [15.0]

        avg_t = sum(d_temp) / max(len(d_temp), 1)
        avg_h = sum(d_hum) / max(len(d_hum), 1)
        sum_r = sum(d_rain)
        max_p = max(d_prob) if d_prob else 10.0

        cond = "Sunny / Clear"
        if sum_r > 5.0 or max_p > 70:
            cond = "Thunderstorm / Heavy Showers"
        elif sum_r > 1.0 or max_p > 45:
            cond = "Scattered Rain & High Humidity"
        elif avg_h > 75:
            cond = "Overcast & Damp"
        elif avg_t > 30:
            cond = "Hot & Dry"

        outlook_days.append({
            "day_label": labels[i],
            "hours_from_now": i * 24,
            "temperature": round(avg_t, 1),
            "humidity": round(avg_h, 1),
            "rain_mm": round(sum_r, 1),
            "rain_probability": round(max_p, 1),
            "condition_summary": cond
        })

    return {
        "current": {
            "temperature": round(temp_curr, 1),
            "humidity": round(hum_curr, 1),
            "precipitation": round(rain_curr, 1),
            "rain_probability": round(max_rain_prob_24h, 1),
            "wind": round(wind_curr, 1),
            "wetness_proxy": round(wetness_proxy, 1),
            "forecast_change": forecast_trend
        },
        "features": {
            "mean_temp_24h": round(mean_temp_24h, 1),
            "max_temp_24h": round(max_temp_24h, 1),
            "mean_hum_24h": round(mean_hum_24h, 1),
            "high_hum_hours_24h": high_hum_hours_24h,
            "total_rain_24h": round(total_rain_24h, 1),
            "total_rain_72h": round(total_rain_72h, 1),
            "max_rain_prob_24h": round(max_rain_prob_24h, 1),
            "mean_wind": round(mean_wind, 1),
            "wetness_proxy": round(wetness_proxy, 1),
            "forecast_trend": forecast_trend
        },
        "outlook_days": outlook_days
    }

def get_fallback_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Deterministic simulated realistic tomato field weather profile (e.g. humid early morning with light rain).
    """
    return {
        "current": {
            "temperature": 25.8,
            "humidity": 84.0,
            "precipitation": 2.4,
            "rain_probability": 75.0,
            "wind": 7.2,
            "wetness_proxy": 81.5,
            "forecast_change": "High humidity & intermittent rain over next 48h"
        },
        "features": {
            "mean_temp_24h": 25.2,
            "max_temp_24h": 28.5,
            "mean_hum_24h": 83.5,
            "high_hum_hours_24h": 14,
            "total_rain_24h": 12.4,
            "total_rain_72h": 24.8,
            "max_rain_prob_24h": 85.0,
            "mean_wind": 7.5,
            "wetness_proxy": 82.0,
            "forecast_trend": "Fungal spore germination window open"
        },
        "outlook_days": [
            {
                "day_label": "Today",
                "hours_from_now": 0,
                "temperature": 25.8,
                "humidity": 84.0,
                "rain_mm": 12.4,
                "rain_probability": 85.0,
                "condition_summary": "Humid / Intermittent Rain"
            },
            {
                "day_label": "+24h",
                "hours_from_now": 24,
                "temperature": 24.5,
                "humidity": 88.0,
                "rain_mm": 16.2,
                "rain_probability": 90.0,
                "condition_summary": "Thunderstorms & High Wetness"
            },
            {
                "day_label": "+48h",
                "hours_from_now": 48,
                "temperature": 26.0,
                "humidity": 81.0,
                "rain_mm": 4.5,
                "rain_probability": 55.0,
                "condition_summary": "Scattered Showers"
            },
            {
                "day_label": "+72h",
                "hours_from_now": 72,
                "temperature": 27.5,
                "humidity": 68.0,
                "rain_mm": 0.2,
                "rain_probability": 20.0,
                "condition_summary": "Partly Cloudy / Drying"
            }
        ]
    }
