import logging
from datetime import datetime
from typing import Optional
from app.database.connection import get_db
from app.schemas.telemetry import NormalizedCityTelemetry
from app.models.observation import CityObservation

logger = logging.getLogger("livingcity.logger")

async def log_city_observation(telemetry: NormalizedCityTelemetry):
    """
    Saves authentic observation state into MongoDB city_observations collection
    """
    db = get_db()
    if db is None:
        logger.warning("MongoDB unavailable; skipping observation persistence.")
        return

    try:
        doc = CityObservation(
            city_id=telemetry.city_id,
            city_name=telemetry.city_name,
            country=telemetry.country,
            timestamp=telemetry.timestamp,
            
            # Weather
            temperature=telemetry.weather.temperature,
            feels_like=telemetry.weather.feels_like,
            humidity=telemetry.weather.humidity,
            rainfall_1h=telemetry.weather.rainfall_1h,
            rainfall_3h=telemetry.weather.rainfall_3h,
            cloudiness=telemetry.weather.cloudiness,
            wind_speed=telemetry.weather.wind_speed,
            weather_condition=telemetry.weather.weather_condition,
            weather_icon=telemetry.weather.weather_icon,
            weather_severity=telemetry.weather.weather_severity,
            
            # AQI
            aqi=telemetry.aqi.aqi,
            pm2_5=telemetry.aqi.pm2_5,
            pm10=telemetry.aqi.pm10,
            no2=telemetry.aqi.no2,
            o3=telemetry.aqi.o3,
            aqi_status=telemetry.aqi.category,
            
            # Traffic
            current_speed=telemetry.traffic.current_speed,
            free_flow_speed=telemetry.traffic.free_flow_speed,
            traffic_delay_seconds=telemetry.traffic.delay_seconds,
            congestion=telemetry.traffic.congestion,
            traffic_level=telemetry.traffic.traffic_level,
            
            # Derived indicators
            derived_flood_risk=telemetry.derived_flood_risk.level,
            derived_flood_risk_score=telemetry.derived_flood_risk.score,
            city_health=telemetry.city_health.level,
            city_health_score=telemetry.city_health.score,
            
            data_sources={
                "weather": telemetry.weather.source,
                "traffic": telemetry.traffic.source,
                "aqi": telemetry.aqi.source
            }
        )
        
        await db["city_observations"].insert_one(doc.model_dump(by_alias=True))
        logger.info(f"Recorded observation for {telemetry.city_name} at {telemetry.timestamp.isoformat()}")
    except Exception as e:
        logger.error(f"Failed to log observation into MongoDB: {e}")
