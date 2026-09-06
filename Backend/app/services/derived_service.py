from datetime import datetime
from typing import Dict, Any, Tuple
from app.schemas.telemetry import WeatherData, TrafficData, AQIData, DerivedFloodRisk, CityHealthData

def calculate_derived_flood_risk(weather: WeatherData) -> DerivedFloodRisk:
    """
    Transparent deterministic calculation of Derived Flood Risk:
    Inputs:
    - rainfall_1h (mm) [weight 35%]
    - forecast_rain_3h (mm) [weight 30%]
    - humidity (%) [weight 15%]
    - cloudiness (%) [weight 10%]
    - forecast_rain_24h (mm) [weight 10%]
    """
    if weather.status != "available":
        return DerivedFloodRisk(
            status="insufficient_data",
            level="Low",
            score=0.0,
            label="Derived Flood Risk (Data unavailable)",
            calculation_breakdown={},
            formula_description="Meteorological data unavailable for calculation",
            confidence_level="Unavailable",
            last_calculated=datetime.utcnow()
        )

    r_1h = max(0.0, weather.rainfall_1h or 0.0)
    r_f3h = max(0.0, weather.forecast_rain_3h or 0.0)
    humidity = max(0.0, min(100.0, weather.humidity or 50.0))
    cloudiness = max(0.0, min(100.0, weather.cloudiness or 0.0))
    r_f24h = max(0.0, weather.forecast_rain_24h or 0.0)

    # Component weights scaled to 0 - 100
    # Rainfall >= 30mm/h is critical flooding
    c_r1 = min(35.0, (r_1h / 30.0) * 35.0)
    c_rf3 = min(30.0, (r_f3h / 40.0) * 30.0)
    c_hum = (humidity / 100.0) * 15.0
    c_cloud = (cloudiness / 100.0) * 10.0
    c_r24 = min(10.0, (r_f24h / 75.0) * 10.0)

    total_score = round(c_r1 + c_rf3 + c_hum + c_cloud + c_r24, 1)
    total_score = max(0.0, min(100.0, total_score))

    # Classification
    if total_score < 35.0:
        level = "Low"
    elif total_score <= 70.0:
        level = "Moderate"
    else:
        level = "High"

    breakdown = {
        "current_rainfall_component": round(c_r1, 1),
        "forecast_3h_component": round(c_rf3, 1),
        "humidity_saturation_component": round(c_hum, 1),
        "cloud_density_component": round(c_cloud, 1),
        "cumulative_24h_component": round(c_r24, 1),
        "total_derived_score": total_score
    }

    return DerivedFloodRisk(
        status="calculated",
        level=level,
        score=total_score,
        label="Derived Flood Risk",
        calculation_breakdown=breakdown,
        formula_description="Deterministic index: (Rainfall_1h*0.35) + (Forecast_3h*0.30) + (Humidity*0.15) + (Cloudiness*0.10) + (Rainfall_24h*0.10)",
        confidence_level="Mathematical Model",
        last_calculated=datetime.utcnow()
    )


def calculate_city_health(
    weather: WeatherData,
    traffic: TrafficData,
    aqi: AQIData,
    flood_risk: DerivedFloodRisk
) -> CityHealthData:
    """
    Transparent calculation of City Health:
    Baseline = 100.0
    Penalties subtracted:
    - Traffic congestion penalty (max 30 pts): congestion_ratio * 30
    - Flood risk penalty (max 35 pts): (flood_risk_score / 100) * 35
    - Weather severity penalty (max 15 pts): Normal=0, Watch=8, Severe=15
    - AQI pollution penalty (max 20 pts): AQI scale 1-5 maps to (aqi-1)/4 * 20
    """
    # If weather and traffic are both unavailable, insufficient data
    if weather.status != "available" and traffic.status != "available":
        return CityHealthData(
            status="insufficient_data",
            level="Insufficient data",
            score=0.0,
            penalties={},
            calculation_explanation="Core urban telemetry indicators unavailable",
            last_calculated=datetime.utcnow()
        )

    # Traffic penalty
    traffic_penalty = 0.0
    if traffic.status == "available" and traffic.congestion is not None:
        traffic_penalty = traffic.congestion * 30.0
    elif traffic.traffic_level == "High":
        traffic_penalty = 25.0
    elif traffic.traffic_level == "Moderate":
        traffic_penalty = 12.0

    # Flood risk penalty
    flood_penalty = (flood_risk.score / 100.0) * 35.0

    # Weather severity penalty
    weather_penalty = 0.0
    if weather.weather_severity == "Severe":
        weather_penalty = 15.0
    elif weather.weather_severity == "Watch":
        weather_penalty = 8.0

    # AQI penalty
    aqi_penalty = 0.0
    if aqi.status == "available" and aqi.aqi:
        # AQI 1 to 5 scale
        aqi_penalty = max(0.0, min(20.0, ((aqi.aqi - 1) / 4.0) * 20.0))

    total_penalty = traffic_penalty + flood_penalty + weather_penalty + aqi_penalty
    health_score = max(0.0, min(100.0, round(100.0 - total_penalty, 1)))

    if health_score >= 75.0:
        level = "Good"
    elif health_score >= 50.0:
        level = "Moderate"
    else:
        level = "Attention Required"

    penalties = {
        "traffic_congestion_penalty": round(traffic_penalty, 1),
        "flood_risk_penalty": round(flood_penalty, 1),
        "weather_severity_penalty": round(weather_penalty, 1),
        "air_quality_penalty": round(aqi_penalty, 1),
        "total_penalty": round(total_penalty, 1)
    }

    return CityHealthData(
        status="calculated",
        level=level,
        score=health_score,
        penalties=penalties,
        calculation_explanation="Deterministic formula: 100 - (Traffic_Penalty + Flood_Penalty + Weather_Penalty + AQI_Penalty)",
        last_calculated=datetime.utcnow()
    )
