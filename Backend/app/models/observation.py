from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class CityObservation(BaseModel):
    id: Optional[str] = None
    city_id: str
    city_name: str
    country: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Weather metrics (OpenWeather)
    temperature: Optional[float] = None
    feels_like: Optional[float] = None
    humidity: Optional[float] = None
    rainfall_1h: Optional[float] = None  # mm
    rainfall_3h: Optional[float] = None  # mm
    cloudiness: Optional[float] = None   # %
    wind_speed: Optional[float] = None   # m/s or km/h
    weather_condition: Optional[str] = None
    weather_icon: Optional[str] = None
    weather_severity: str = "Normal"     # Normal, Watch, Severe
    
    # Air Quality (AQI API)
    aqi: Optional[int] = None            # 1-5 scale or US AQI 0-500
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    aqi_status: Optional[str] = None     # Good, Moderate, Unhealthy, etc.
    
    # Traffic (TomTom)
    current_speed: Optional[float] = None
    free_flow_speed: Optional[float] = None
    traffic_delay_seconds: Optional[float] = None
    congestion: Optional[float] = None   # 0.0 - 1.0 (Congestion = 1 - (Current Speed / Free Flow Speed))
    traffic_level: str = "Low"          # Low, Moderate, High
    
    # Derived Indicators (Strictly deterministic calculations)
    derived_flood_risk: str = "Low"      # Low, Moderate, High
    derived_flood_risk_score: float = 0.0 # 0 - 100
    city_health: str = "Good"            # Good, Moderate, Attention Required
    city_health_score: float = 100.0     # 0 - 100
    
    # Raw Metadata & Provider origin flags
    data_sources: Dict[str, str] = Field(default_factory=dict) # e.g. {"weather": "OpenWeather", "traffic": "TomTom", "aqi": "OpenAQ"}

    class Config:
        populate_by_name = True
