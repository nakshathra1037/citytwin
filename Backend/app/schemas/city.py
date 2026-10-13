from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class CameraView(BaseModel):
    latitude: float
    longitude: float
    height: float = 12000.0
    heading: float = 0.0
    pitch: float = -45.0
    roll: float = 0.0

class CityCorridor(BaseModel):
    id: str
    name: str
    coordinates: List[List[float]] # [[lon, lat], [lon, lat], ...]
    length_km: float
    capacity_vph: int

class CityFloodZone(BaseModel):
    id: str
    name: str
    polygon: List[List[float]] # [[lon, lat], ...]
    elevation_meters: float
    catchment_area_km2: float
    drainage_capacity_mmh: float

class CitySensorNode(BaseModel):
    id: str
    name: str
    sensor_type: str # "aqi", "weather", "flood", "traffic"
    latitude: float
    longitude: float
    elevation_meters: float = 30.0
    status: str = "active"
    description: Optional[str] = None

class CityMetadata(BaseModel):
    id: str
    name: str
    state: str
    country: str
    latitude: float
    longitude: float
    camera: CameraView
    population: int
    area_km2: float
    primary_corridors: List[CityCorridor] = []
    flood_catchments: List[CityFloodZone] = []
    sensor_nodes: List[CitySensorNode] = []
    timezone: str = "Asia/Kolkata"
