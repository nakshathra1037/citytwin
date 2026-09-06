from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class WeatherData(BaseModel):
    status: str = "available" # "available", "unavailable"
    temperature: Optional[float] = None
    feels_like: Optional[float] = None
    humidity: Optional[float] = None
    rainfall_1h: Optional[float] = None # mm
    rainfall_3h: Optional[float] = None
    cloudiness: Optional[float] = None  # %
    wind_speed: Optional[float] = None  # km/h
    wind_deg: Optional[float] = None
    weather_condition: Optional[str] = None
    weather_icon: Optional[str] = None
    weather_severity: str = "Normal"    # "Normal", "Watch", "Severe"
    forecast_rain_3h: Optional[float] = 0.0
    forecast_rain_24h: Optional[float] = 0.0
    forecast: Optional[List[Dict[str, Any]]] = []
    source: str = "OpenWeather API"
    last_updated: datetime = datetime.utcnow()

class TrafficData(BaseModel):
    status: str = "available" # "available", "unavailable"
    current_speed: Optional[float] = None      # km/h
    free_flow_speed: Optional[float] = None    # km/h
    delay_seconds: Optional[float] = None
    congestion: Optional[float] = None        # 0.0 to 1.0 (Congestion = 1 - (Current Speed / Free Flow Speed))
    congestion_percentage: Optional[float] = None # 0% - 100%
    traffic_level: str = "Low"                 # "Low", "Moderate", "High"
    corridor_conditions: Optional[List[Dict[str, Any]]] = []
    source: str = "TomTom Traffic API"
    last_updated: datetime = datetime.utcnow()

class AQIData(BaseModel):
    status: str = "available" # "available", "unavailable"
    aqi: Optional[int] = None # 1-5 scale or 0-500
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    category: Optional[str] = None # "Good", "Moderate", "Unhealthy", "Hazardous"
    source: str = "AQI API"
    last_updated: datetime = datetime.utcnow()

class DerivedFloodRisk(BaseModel):
    status: str = "calculated"
    level: str = "Low" # "Low", "Moderate", "High"
    score: float = 0.0 # 0 - 100
    label: str = "Derived Flood Risk"
    calculation_breakdown: Dict[str, float] = {}
    formula_description: str = "Calculated from (Rainfall_1h*0.35) + (Forecast_3h*0.30) + (Humidity*0.15) + (Cloudiness*0.10) + (Rainfall_24h*0.10)"
    confidence_level: str = "Deterministic Formula"
    last_calculated: datetime = datetime.utcnow()

class CityHealthData(BaseModel):
    status: str = "calculated" # "calculated", "insufficient_data"
    level: str = "Good" # "Good", "Moderate", "Attention Required"
    score: float = 100.0 # 0 - 100
    penalties: Dict[str, float] = {}
    calculation_explanation: str = "Derived deterministically from Traffic Congestion (30%), Flood Risk (35%), Weather Severity (15%), and AQI (20%)"
    last_calculated: datetime = datetime.utcnow()

class NormalizedCityTelemetry(BaseModel):
    city_id: str
    city_name: str
    country: str
    timestamp: datetime = datetime.utcnow()
    weather: WeatherData
    traffic: TrafficData
    aqi: AQIData
    derived_flood_risk: DerivedFloodRisk
    city_health: CityHealthData
    overall_status: str = "Optimal"
