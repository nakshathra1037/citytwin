import logging
import httpx
from datetime import datetime
from typing import Optional
from app.config import settings
from app.schemas.telemetry import AQIData
from app.services.city_catalog import get_city_metadata

logger = logging.getLogger("livingcity.aqi")

async def fetch_aqi_data(city_id: str) -> AQIData:
    city = get_city_metadata(city_id)
    if not city:
        return AQIData(status="unavailable", source="Unknown City")

    # We check OpenWeather API key first as OpenWeather Air Pollution endpoint uses the same key
    api_key = (settings.AQI_API_KEY.strip() or settings.OPENWEATHER_API_KEY.strip())
    if not api_key:
        logger.info(f"AQI API key not configured for city {city_id}.")
        return AQIData(
            status="unavailable",
            category="Air quality data unavailable",
            source="AQI API (Unconfigured)"
        )

    try:
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={city.latitude}&lon={city.longitude}&appid={api_key}"
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(url)
            if res.status_code != 200:
                logger.warning(f"AQI API returned status: {res.status_code}")
                return AQIData(
                    status="unavailable",
                    category="Air quality data unavailable",
                    source="AQI API"
                )
            
            data = res.json().get("list", [{}])[0]
            main = data.get("main", {})
            components = data.get("components", {})
            
            aqi_val = main.get("aqi") # 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
            category_map = {
                1: "Good",
                2: "Fair",
                3: "Moderate",
                4: "Poor",
                5: "Very Poor"
            }
            category = category_map.get(aqi_val, "Moderate")
            
            return AQIData(
                status="available",
                aqi=aqi_val,
                pm2_5=round(float(components.get("pm2_5", 0.0)), 1),
                pm10=round(float(components.get("pm10", 0.0)), 1),
                no2=round(float(components.get("no2", 0.0)), 1),
                o3=round(float(components.get("o3", 0.0)), 1),
                category=category,
                source="OpenWeather Air Pollution API",
                last_updated=datetime.utcnow()
            )
    except Exception as e:
        logger.error(f"Failed to fetch AQI: {e}")
        return AQIData(
            status="unavailable",
            category="Air quality data unavailable",
            source="AQI API"
        )
