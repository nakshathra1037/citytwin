import pytest
from app.services.city_catalog import get_all_cities, get_city_metadata
from app.services.derived_service import calculate_derived_flood_risk, calculate_city_health
from app.schemas.telemetry import WeatherData, TrafficData, AQIData
from app.simulation.engine import run_simulation
from app.schemas.simulation import SimulationRequest
from app.schemas.telemetry import NormalizedCityTelemetry

def test_cities_catalog():
    cities = get_all_cities()
    assert len(cities) >= 4
    cbe = get_city_metadata("coimbatore")
    assert cbe is not None
    assert cbe.name == "Coimbatore"
    assert len(cbe.primary_corridors) > 0
    assert len(cbe.flood_catchments) > 0

def test_derived_flood_risk_calculation():
    weather = WeatherData(
        status="available",
        rainfall_1h=15.0,
        forecast_rain_3h=20.0,
        humidity=80.0,
        cloudiness=75.0,
        forecast_rain_24h=35.0
    )
    result = calculate_derived_flood_risk(weather)
    assert result.status == "calculated"
    assert result.score > 0
    assert result.level in ["Low", "Moderate", "High"]
    assert "current_rainfall_component" in result.calculation_breakdown

def test_city_health_calculation():
    weather = WeatherData(status="available", weather_severity="Normal")
    traffic = TrafficData(status="available", congestion=0.2, traffic_level="Low")
    aqi = AQIData(status="available", aqi=2)
    flood = calculate_derived_flood_risk(weather)
    health = calculate_city_health(weather, traffic, aqi, flood)
    assert health.status == "calculated"
    assert 0 <= health.score <= 100
    assert health.level in ["Good", "Moderate", "Attention Required"]

def test_simulation_engine():
    weather = WeatherData(status="available", rainfall_1h=5.0)
    traffic = TrafficData(status="available", congestion=0.25, current_speed=40.0, free_flow_speed=50.0)
    aqi = AQIData(status="available", aqi=1)
    flood = calculate_derived_flood_risk(weather)
    health = calculate_city_health(weather, traffic, aqi, flood)
    
    telemetry = NormalizedCityTelemetry(
        city_id="coimbatore",
        city_name="Coimbatore",
        country="India",
        weather=weather,
        traffic=traffic,
        aqi=aqi,
        derived_flood_risk=flood,
        city_health=health
    )
    
    req = SimulationRequest(
        city_id="coimbatore",
        rainfall_delta_pct=50.0,
        traffic_delta_pct=20.0,
        drainage_efficiency=1.0
    )
    
    sim = run_simulation(telemetry, req)
    assert sim.status == "success"
    assert len(sim.comparison_table) >= 4
    # Check that rainfall increased by 50%
    assert sim.simulated_state["rainfall_1h"] == 7.5
