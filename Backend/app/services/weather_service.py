import logging
import httpx
from datetime import datetime
from typing import Optional, Dict, Any
from app.config import settings
from app.schemas.telemetry import WeatherData
from app.services.city_catalog import get_city_metadata

logger = logging.getLogger("livingcity.weather")

async def fetch_weather_data(city_id: str) -> WeatherData:
    city = get_city_metadata(city_id)
    if not city:
        return WeatherData(status="unavailable", source="Unknown City")

    api_key = settings.OPENWEATHER_API_KEY.strip()
    if not api_key:
        logger.info(f"OpenWeather API key not configured for city {city_id}.")
        return WeatherData(
            status="unavailable",
            weather_condition="Weather data unavailable (API key not configured)",
            source="OpenWeather API (Unconfigured)"
        )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={city.latitude}&lon={city.longitude}&appid={api_key}&units=metric"
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={city.latitude}&lon={city.longitude}&appid={api_key}&units=metric"
            
            w_res, f_res = await httpx.gather(
                client.get(weather_url),
                client.get(forecast_url),
                return_exceptions=True
            )
            
            if isinstance(w_res, Exception) or w_res.status_code != 200:
                logger.warning(f"OpenWeather API returned status: {getattr(w_res, 'status_code', 'Error')}")
                return WeatherData(
                    status="unavailable",
                    weather_condition="Weather data unavailable",
                    source="OpenWeather API"
                )
            
            w_json = w_res.json()
            main_data = w_json.get("main", {})
            weather_desc = w_json.get("weather", [{}])[0]
            wind_data = w_json.get("wind", {})
            rain_data = w_json.get("rain", {})
            clouds_data = w_json.get("clouds", {})
            
            temp = float(main_data.get("temp", 0.0))
            feels_like = float(main_data.get("feels_like", temp))
            humidity = float(main_data.get("humidity", 0.0))
            wind_speed = float(wind_data.get("speed", 0.0)) * 3.6 # m/s to km/h
            wind_deg = float(wind_data.get("deg", 0.0))
            cloudiness = float(clouds_data.get("all", 0.0))
            
            rainfall_1h = float(rain_data.get("1h", 0.0))
            rainfall_3h = float(rain_data.get("3h", 0.0))
            
            # Parse forecast
            forecast_rain_3h = 0.0
            forecast_rain_24h = 0.0
            forecast_items = []
            
            if not isinstance(f_res, Exception) and f_res.status_code == 200:
                f_json = f_res.json()
                items = f_json.get("list", [])[:8] # next 24 hours (3-hour intervals)
                for idx, item in enumerate(items):
                    item_rain = float(item.get("rain", {}).get("3h", 0.0))
                    if idx == 0:
                        forecast_rain_3h = item_rain
                    forecast_rain_24h += item_rain
                    forecast_items.append({
                        "time": item.get("dt_txt"),
                        "temp": item.get("main", {}).get("temp"),
                        "condition": item.get("weather", [{}])[0].get("main"),
                        "rain_3h": item_rain
                    })
            
            # Severity classification: Normal, Watch, Severe
            condition_main = weather_desc.get("main", "Clear")
            severity = "Normal"
            if condition_main in ["Thunderstorm", "Squall", "Tornado"] or rainfall_1h >= 25.0 or wind_speed >= 60.0:
                severity = "Severe"
            elif condition_main in ["Rain", "Drizzle"] or rainfall_1h >= 10.0 or wind_speed >= 40.0:
                severity = "Watch"
                
            return WeatherData(
                status="available",
                temperature=round(temp, 1),
                feels_like=round(feels_like, 1),
                humidity=round(humidity, 1),
                rainfall_1h=round(rainfall_1h, 2),
                rainfall_3h=round(rainfall_3h, 2),
                cloudiness=round(cloudiness, 1),
                wind_speed=round(wind_speed, 1),
                wind_deg=round(wind_deg, 1),
                weather_condition=condition_main,
                weather_icon=weather_desc.get("icon"),
                weather_severity=severity,
                forecast_rain_3h=round(forecast_rain_3h, 2),
                forecast_rain_24h=round(forecast_rain_24h, 2),
                forecast=forecast_items,
                source="OpenWeather API",
                last_updated=datetime.utcnow()
            )
            
    except Exception as e:
        logger.error(f"Failed to fetch weather: {e}")
        return WeatherData(
            status="unavailable",
            weather_condition="Weather data unavailable",
            source="OpenWeather API"
        )
