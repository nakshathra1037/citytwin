from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from app.schemas.telemetry import NormalizedCityTelemetry, WeatherData, TrafficData, AQIData
from app.services.city_catalog import get_city_metadata
from app.services.weather_service import fetch_weather_data
from app.services.traffic_service import fetch_traffic_data
from app.services.aqi_service import fetch_aqi_data
from app.services.derived_service import calculate_derived_flood_risk, calculate_city_health
from app.services.observation_logger import log_city_observation

router = APIRouter(prefix="/api", tags=["Urban Telemetry"])

async def assemble_city_telemetry(city_id: str) -> NormalizedCityTelemetry:
    city = get_city_metadata(city_id)
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City '{city_id}' is not registered."
        )

    # 1. Fetch real API data
    weather = await fetch_weather_data(city_id)
    traffic = await fetch_traffic_data(city_id)
    aqi = await fetch_aqi_data(city_id)

    # 2. Compute deterministic derived indicators
    flood_risk = calculate_derived_flood_risk(weather)
    city_health = calculate_city_health(weather, traffic, aqi, flood_risk)

    overall_status = "Optimal"
    if city_health.score < 50.0 or flood_risk.level == "High" or traffic.traffic_level == "High":
        overall_status = "Attention Required"
    elif city_health.score < 75.0 or flood_risk.level == "Moderate" or traffic.traffic_level == "Moderate":
        overall_status = "Moderate Alert"

    telemetry = NormalizedCityTelemetry(
        city_id=city.id,
        city_name=city.name,
        country=city.country,
        timestamp=datetime.utcnow(),
        weather=weather,
        traffic=traffic,
        aqi=aqi,
        derived_flood_risk=flood_risk,
        city_health=city_health,
        overall_status=overall_status
    )

    # 3. Log observation into MongoDB asynchronously
    await log_city_observation(telemetry)

    return telemetry


@router.get("/city/{city_id}/telemetry", response_model=NormalizedCityTelemetry)
async def get_city_telemetry(city_id: str):
    return await assemble_city_telemetry(city_id)


@router.get("/weather/{city_id}", response_model=WeatherData)
async def get_weather(city_id: str):
    return await fetch_weather_data(city_id)


@router.get("/traffic/{city_id}", response_model=TrafficData)
async def get_traffic(city_id: str):
    return await fetch_traffic_data(city_id)


@router.get("/air-quality/{city_id}", response_model=AQIData)
async def get_aqi(city_id: str):
    return await fetch_aqi_data(city_id)
