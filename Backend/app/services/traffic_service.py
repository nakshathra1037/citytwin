import logging
import httpx
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.config import settings
from app.schemas.telemetry import TrafficData
from app.services.city_catalog import get_city_metadata

logger = logging.getLogger("livingcity.traffic")

async def fetch_traffic_data(city_id: str) -> TrafficData:
    city = get_city_metadata(city_id)
    if not city:
        return TrafficData(status="unavailable", source="Unknown City")

    api_key = settings.TOMTOM_API_KEY.strip()
    if not api_key:
        logger.info(f"TomTom API key not configured for city {city_id}.")
        return TrafficData(
            status="unavailable",
            traffic_level="Low",
            source="TomTom Traffic API (Unconfigured)"
        )

    try:
        corridor_results = []
        total_curr_speed = 0.0
        total_ff_speed = 0.0
        valid_points = 0
        total_delay = 0.0
        
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Query TomTom Flow Segment API for primary corridors
            for corridor in city.primary_corridors[:4]:
                if not corridor.coordinates:
                    continue
                mid_point = corridor.coordinates[len(corridor.coordinates) // 2]
                lon, lat = mid_point[0], mid_point[1]
                
                url = (
                    f"https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json"
                    f"?point={lat}%2C{lon}&unit=KMPH&key={api_key}"
                )
                
                try:
                    res = await client.get(url)
                    if res.status_code == 200:
                        flow_data = res.json().get("flowSegmentData", {})
                        curr_spd = float(flow_data.get("currentSpeed", 40.0))
                        ff_spd = float(flow_data.get("freeFlowSpeed", 50.0))
                        delay = float(flow_data.get("currentTravelTime", 0)) - float(flow_data.get("freeFlowTravelTime", 0))
                        delay = max(0.0, delay)
                        
                        # Congestion = 1 - (Current Speed / Free Flow Speed)
                        c_ratio = max(0.0, min(1.0, 1.0 - (curr_spd / max(1.0, ff_spd))))
                        level = "Low" if c_ratio < 0.25 else ("Moderate" if c_ratio < 0.55 else "High")
                        
                        corridor_results.append({
                            "corridor_id": corridor.id,
                            "name": corridor.name,
                            "current_speed": round(curr_spd, 1),
                            "free_flow_speed": round(ff_spd, 1),
                            "congestion_ratio": round(c_ratio, 3),
                            "traffic_level": level,
                            "delay_seconds": round(delay, 1),
                            "coordinates": corridor.coordinates
                        })
                        
                        total_curr_speed += curr_spd
                        total_ff_speed += ff_spd
                        total_delay += delay
                        valid_points += 1
                except Exception as ex:
                    logger.warning(f"Error fetching corridor {corridor.id}: {ex}")

        if valid_points == 0:
            return TrafficData(
                status="unavailable",
                traffic_level="Low",
                source="TomTom Traffic API"
            )

        avg_curr = total_curr_speed / valid_points
        avg_ff = total_ff_speed / valid_points
        overall_congestion = max(0.0, min(1.0, 1.0 - (avg_curr / max(1.0, avg_ff))))
        
        traffic_level = "Low" if overall_congestion < 0.25 else ("Moderate" if overall_congestion < 0.55 else "High")
        
        return TrafficData(
            status="available",
            current_speed=round(avg_curr, 1),
            free_flow_speed=round(avg_ff, 1),
            delay_seconds=round(total_delay / valid_points, 1),
            congestion=round(overall_congestion, 3),
            congestion_percentage=round(overall_congestion * 100, 1),
            traffic_level=traffic_level,
            corridor_conditions=corridor_results,
            source="TomTom Traffic API",
            last_updated=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Failed to fetch TomTom traffic: {e}")
        return TrafficData(
            status="unavailable",
            traffic_level="Low",
            source="TomTom Traffic API"
        )
