from datetime import datetime
from typing import Dict, Any, List
from app.schemas.telemetry import NormalizedCityTelemetry, WeatherData, TrafficData, AQIData
from app.schemas.simulation import SimulationRequest, SimulationResponse, ComparisonRow
from app.services.derived_service import calculate_derived_flood_risk, calculate_city_health

def run_simulation(
    current_telemetry: NormalizedCityTelemetry,
    params: SimulationRequest
) -> SimulationResponse:
    """
    Executes a deterministic what-if scenario by applying parameter deltas
    to current real telemetry and recalculating derived indices.
    """
    curr_weather = current_telemetry.weather
    curr_traffic = current_telemetry.traffic
    curr_aqi = current_telemetry.aqi
    curr_flood = current_telemetry.derived_flood_risk
    curr_health = current_telemetry.city_health

    # 1. Simulate Weather variables
    # Rainfall delta (e.g. +50% -> 1.5)
    rain_factor = max(0.0, 1.0 + (params.rainfall_delta_pct / 100.0))
    base_r1 = curr_weather.rainfall_1h if (curr_weather.rainfall_1h is not None and curr_weather.status == "available") else 2.5
    base_f3 = curr_weather.forecast_rain_3h if (curr_weather.forecast_rain_3h is not None and curr_weather.status == "available") else 5.0
    base_f24 = curr_weather.forecast_rain_24h if (curr_weather.forecast_rain_24h is not None and curr_weather.status == "available") else 12.0
    
    sim_r1 = round(base_r1 * rain_factor, 2)
    sim_f3 = round(base_f3 * rain_factor, 2)
    sim_f24 = round(base_f24 * rain_factor, 2)
    
    # Humidity increases with rainfall
    curr_hum = curr_weather.humidity or 60.0
    sim_hum = min(100.0, round(curr_hum + (params.rainfall_delta_pct * 0.15), 1))
    
    # Clouds
    curr_clouds = curr_weather.cloudiness or 40.0
    sim_clouds = min(100.0, max(0.0, round(curr_clouds + (params.rainfall_delta_pct * 0.2), 1)))

    sim_weather = WeatherData(
        status="available",
        temperature=curr_weather.temperature,
        feels_like=curr_weather.feels_like,
        humidity=sim_hum,
        rainfall_1h=sim_r1,
        rainfall_3h=round(sim_r1 * 2.2, 2),
        cloudiness=sim_clouds,
        wind_speed=curr_weather.wind_speed,
        weather_condition="Rain" if sim_r1 > 5.0 else curr_weather.weather_condition,
        weather_severity="Severe" if sim_r1 >= 25.0 else ("Watch" if sim_r1 >= 10.0 else "Normal"),
        forecast_rain_3h=sim_f3,
        forecast_rain_24h=sim_f24,
        source="Simulated Scenario",
        last_updated=datetime.utcnow()
    )

    # 2. Simulate Traffic variables
    # Traffic volume delta + rain induced road speed reduction
    traffic_factor = max(0.1, 1.0 + (params.traffic_delta_pct / 100.0))
    rain_slowdown = max(0.0, min(0.35, (sim_r1 / 40.0) * 0.35)) # heavy rain reduces road speeds
    
    base_curr_spd = curr_traffic.current_speed or 38.0
    base_ff_spd = curr_traffic.free_flow_speed or 50.0
    
    sim_curr_spd = max(8.0, round((base_curr_spd / traffic_factor) * (1.0 - rain_slowdown), 1))
    sim_ff_spd = base_ff_spd
    sim_congestion = max(0.0, min(1.0, round(1.0 - (sim_curr_spd / sim_ff_spd), 3)))
    sim_traffic_level = "Low" if sim_congestion < 0.25 else ("Moderate" if sim_congestion < 0.55 else "High")

    sim_traffic = TrafficData(
        status="available",
        current_speed=sim_curr_spd,
        free_flow_speed=sim_ff_spd,
        delay_seconds=round((curr_traffic.delay_seconds or 120.0) * traffic_factor * (1.0 + rain_slowdown), 1),
        congestion=sim_congestion,
        congestion_percentage=round(sim_congestion * 100, 1),
        traffic_level=sim_traffic_level,
        source="Simulated Scenario",
        last_updated=datetime.utcnow()
    )

    # 3. Recalculate Derived Indicators with Drainage factor
    sim_flood = calculate_derived_flood_risk(sim_weather)
    # Apply drainage efficiency factor: poor drainage (e.g. 0.6) amplifies score, upgraded (1.4) reduces score
    drainage_eff = max(0.4, min(1.8, params.drainage_efficiency))
    adjusted_score = round(sim_flood.score * (1.0 / drainage_eff), 1)
    sim_flood.score = max(0.0, min(100.0, adjusted_score))
    sim_flood.level = "Low" if sim_flood.score < 35.0 else ("Moderate" if sim_flood.score <= 70.0 else "High")
    sim_flood.label = "Derived Flood Risk (Simulated)"

    # Recalculate City Health
    sim_health = calculate_city_health(sim_weather, sim_traffic, curr_aqi, sim_flood)

    # 4. Construct Comparison Table
    table: List[ComparisonRow] = []

    # Rainfall 1h
    r_curr_str = f"{curr_weather.rainfall_1h or 0.0} mm/h"
    r_sim_str = f"{sim_r1} mm/h"
    r_change_pct = f"{params.rainfall_delta_pct:+.1f}%"
    table.append(ComparisonRow(
        indicator="Precipitation Rate (1h)",
        unit="mm/h",
        current_value=r_curr_str,
        simulated_value=r_sim_str,
        change=r_change_pct,
        risk_direction="worse" if params.rainfall_delta_pct > 0 else ("better" if params.rainfall_delta_pct < 0 else "neutral")
    ))

    # Derived Flood Risk Score
    flood_delta = round(sim_flood.score - curr_flood.score, 1)
    table.append(ComparisonRow(
        indicator="Derived Flood Risk",
        unit="Index (0-100)",
        current_value=f"{curr_flood.score} ({curr_flood.level})",
        simulated_value=f"{sim_flood.score} ({sim_flood.level})",
        change=f"{flood_delta:+0.1f} pts",
        risk_direction="worse" if flood_delta > 3 else ("better" if flood_delta < -3 else "neutral")
    ))

    # Traffic Congestion
    curr_cong_pct = curr_traffic.congestion_percentage or 25.0
    sim_cong_pct = sim_traffic.congestion_percentage
    cong_delta = round(sim_cong_pct - curr_cong_pct, 1)
    table.append(ComparisonRow(
        indicator="Traffic Congestion",
        unit="%",
        current_value=f"{curr_cong_pct:.1f}% ({curr_traffic.traffic_level})",
        simulated_value=f"{sim_cong_pct:.1f}% ({sim_traffic.traffic_level})",
        change=f"{cong_delta:+0.1f}%",
        risk_direction="worse" if cong_delta > 2 else ("better" if cong_delta < -2 else "neutral")
    ))

    # Average Road Speed
    spd_curr = curr_traffic.current_speed or 38.0
    spd_sim = sim_traffic.current_speed
    spd_delta = round(spd_sim - spd_curr, 1)
    table.append(ComparisonRow(
        indicator="Average Road Speed",
        unit="km/h",
        current_value=f"{spd_curr:.1f} km/h",
        simulated_value=f"{spd_sim:.1f} km/h",
        change=f"{spd_delta:+0.1f} km/h",
        risk_direction="better" if spd_delta > 1 else ("worse" if spd_delta < -1 else "neutral")
    ))

    # City Health Score
    health_delta = round(sim_health.score - curr_health.score, 1)
    table.append(ComparisonRow(
        indicator="Overall City Health",
        unit="Index (0-100)",
        current_value=f"{curr_health.score} ({curr_health.level})",
        simulated_value=f"{sim_health.score} ({sim_health.level})",
        change=f"{health_delta:+0.1f} pts",
        risk_direction="better" if health_delta > 1 else ("worse" if health_delta < -1 else "neutral")
    ))

    return SimulationResponse(
        status="success",
        scenario_title=params.scenario_description or "Custom Stress Test",
        city_id=current_telemetry.city_id,
        city_name=current_telemetry.city_name,
        execution_timestamp=datetime.utcnow(),
        comparison_table=table,
        current_state={
            "rainfall_1h": curr_weather.rainfall_1h or 0.0,
            "flood_score": curr_flood.score,
            "flood_level": curr_flood.level,
            "congestion_pct": curr_cong_pct,
            "traffic_speed": spd_curr,
            "city_health_score": curr_health.score,
            "city_health_level": curr_health.level
        },
        simulated_state={
            "rainfall_1h": sim_r1,
            "flood_score": sim_flood.score,
            "flood_level": sim_flood.level,
            "congestion_pct": sim_cong_pct,
            "traffic_speed": sim_curr_spd,
            "city_health_score": sim_health.score,
            "city_health_level": sim_health.level,
            "drainage_efficiency": params.drainage_efficiency
        }
    )
