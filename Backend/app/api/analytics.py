from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.database.connection import get_db

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/{city_id}")
async def get_city_analytics(
    city_id: str,
    limit: int = Query(50, ge=5, le=200)
):
    """
    Retrieves time-series observations from MongoDB city_observations collection.
    If fewer than 3 records exist, returns 'Collecting data for analytics'.
    """
    db = get_db()
    if db is None:
        return {
            "status": "insufficient_data",
            "message": "Collecting data for analytics",
            "observations_count": 0,
            "series": {}
        }

    cursor = db["city_observations"].find(
        {"city_id": city_id.lower()}
    ).sort("timestamp", 1).limit(limit)

    records = await cursor.to_list(length=limit)

    if len(records) < 2:
        return {
            "status": "insufficient_data",
            "message": "Collecting data for analytics",
            "observations_count": len(records),
            "series": {
                "timestamps": [],
                "temperature": [],
                "rainfall": [],
                "traffic_congestion": [],
                "flood_risk_score": [],
                "city_health_score": [],
                "aqi": []
            }
        }

    timestamps = []
    temps = []
    rains = []
    congestions = []
    flood_scores = []
    health_scores = []
    aqis = []

    for r in records:
        ts = r.get("timestamp")
        if isinstance(ts, datetime):
            ts_str = ts.strftime("%m-%d %H:%M")
        else:
            ts_str = str(ts)
        timestamps.append(ts_str)
        temps.append(r.get("temperature"))
        rains.append(r.get("rainfall_1h", 0.0) or 0.0)
        
        cong = r.get("congestion")
        if cong is not None:
            congestions.append(round(cong * 100, 1))
        else:
            congestions.append(None)
            
        flood_scores.append(r.get("derived_flood_risk_score", 0.0))
        health_scores.append(r.get("city_health_score", 100.0))
        aqis.append(r.get("aqi"))

    return {
        "status": "available",
        "city_id": city_id,
        "observations_count": len(records),
        "series": {
            "timestamps": timestamps,
            "temperature": temps,
            "rainfall": rains,
            "traffic_congestion": congestions,
            "flood_risk_score": flood_scores,
            "city_health_score": health_scores,
            "aqi": aqis
        }
    }
