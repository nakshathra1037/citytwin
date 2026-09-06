import re
import logging
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.simulation import SimulationRequest
from app.services.city_catalog import get_city_metadata
from app.api.telemetry import assemble_city_telemetry
from app.simulation.engine import run_simulation
from app.ml.pipeline import predict_flood
from app.gemini.client import gemini_service
from app.gemini.prompts import build_chat_prompt, SYSTEM_INSTRUCTION

logger = logging.getLogger("livingcity.chat")
router = APIRouter(prefix="/api/chat", tags=["Urban AI Assistant"])

@router.post("", response_model=ChatResponse)
async def chat_interaction(request: ChatRequest):
    city = get_city_metadata(request.city_id)
    city_name = city.name if city else "Selected City"
    
    # 1. Fetch current city telemetry
    telemetry = await assemble_city_telemetry(request.city_id)
    
    weather_dict = telemetry.weather.model_dump()
    traffic_dict = telemetry.traffic.model_dump()
    flood_dict = telemetry.derived_flood_risk.model_dump()
    health_dict = telemetry.city_health.model_dump()
    
    structured_current_data = {
        "weather": {
            "status": weather_dict.get("status"),
            "condition": weather_dict.get("weather_condition"),
            "temperature_c": weather_dict.get("temperature"),
            "rainfall_1h_mm": weather_dict.get("rainfall_1h"),
            "forecast_rain_3h_mm": weather_dict.get("forecast_rain_3h"),
            "humidity_pct": weather_dict.get("humidity"),
            "wind_kmh": weather_dict.get("wind_speed"),
            "severity": weather_dict.get("weather_severity")
        },
        "traffic": {
            "status": traffic_dict.get("status"),
            "traffic_level": traffic_dict.get("traffic_level"),
            "congestion_pct": traffic_dict.get("congestion_percentage"),
            "current_speed_kmh": traffic_dict.get("current_speed"),
            "free_flow_speed_kmh": traffic_dict.get("free_flow_speed")
        },
        "derived_flood_risk": {
            "label": "Derived Flood Risk (Deterministic)",
            "level": flood_dict.get("level"),
            "score": flood_dict.get("score"),
            "formula": flood_dict.get("formula_description")
        },
        "city_health": {
            "label": "City Health Index (Deterministic)",
            "level": health_dict.get("level"),
            "score": health_dict.get("score"),
            "penalties": health_dict.get("penalties")
        }
    }

    # 2. Check for hypothetical What-If scenario in user query (e.g. "what if rainfall increases by 50%")
    sim_context = request.simulation_context or {}
    msg_lower = request.message.lower()
    
    data_classifications = ["Current Observation", "Derived Indicator"]
    
    rain_match = re.search(r"rainfall\s*(?:increases?|up|delta)?\s*(?:by)?\s*(\+?\d+)\s*%", msg_lower)
    if "what if" in msg_lower or "simulate" in msg_lower or rain_match:
        data_classifications.append("Simulation Result")
        rain_pct = float(rain_match.group(1)) if rain_match else 50.0
        if "decreas" in msg_lower or "down" in msg_lower or "drop" in msg_lower:
            rain_pct = -abs(rain_pct)
        
        sim_req = SimulationRequest(
            city_id=request.city_id,
            rainfall_delta_pct=rain_pct,
            traffic_delta_pct=0.0,
            drainage_efficiency=1.0,
            scenario_description=f"Auto-Simulation ({rain_pct:+}%)"
        )
        sim_res = run_simulation(telemetry, sim_req)
        sim_context = {
            "simulated_rainfall_delta": f"{rain_pct:+}%",
            "current_flood_score": sim_res.current_state.get("flood_score"),
            "simulated_flood_score": sim_res.simulated_state.get("flood_score"),
            "simulated_flood_level": sim_res.simulated_state.get("flood_level"),
            "comparison_summary": [
                f"{r.indicator}: {r.current_value} -> {r.simulated_value} (Change: {r.change})"
                for r in sim_res.comparison_table
            ]
        }

    # 3. Check if query is prediction related
    if "predict" in msg_lower or "forecast" in msg_lower or "horizon" in msg_lower or request.page_context == "prediction":
        data_classifications.append("ML Prediction")
        ml_res = predict_flood(
            rainfall_1h=telemetry.weather.rainfall_1h or 1.5,
            forecast_3h=telemetry.weather.forecast_rain_3h or 3.0,
            humidity=telemetry.weather.humidity or 65.0,
            cloudiness=telemetry.weather.cloudiness or 40.0,
            rainfall_24h=telemetry.weather.forecast_rain_24h or 8.0,
            temperature=telemetry.weather.temperature or 28.0
        )
        structured_current_data["machine_learning_flood_prediction"] = {
            "algorithm": "RandomForestClassifier",
            "horizon": "Next 3-6 Hours",
            "predicted_label": ml_res["predicted_label"],
            "confidence": ml_res["confidence_score"],
            "top_factor": ml_res["feature_importances"][0].feature_name if ml_res["feature_importances"] else "N/A"
        }

    data_classifications.append("Gemini Explanation")

    # 4. Build prompt and invoke Gemini
    chat_prompt = build_chat_prompt(
        city_name=city_name,
        page_context=request.page_context,
        current_data=structured_current_data,
        simulation_context=sim_context,
        user_message=request.message
    )

    reply_text = await gemini_service.generate_response(chat_prompt, system_prompt=SYSTEM_INSTRUCTION)

    # 5. Suggested follow-ups based on page context
    followups = []
    if request.page_context == "dashboard":
        followups = [
            "Why is the flood risk at this level?",
            "What is currently affecting City Health?",
            "What if rainfall increases by 50%?"
        ]
    elif request.page_context == "digital_twin":
        followups = [
            "Explain the traffic corridors shown on the 3D map.",
            "Which flood catchment zone has the highest vulnerability?",
            "How does terrain elevation affect drainage?"
        ]
    elif request.page_context == "analytics":
        followups = [
            "Summarize the main historical trends.",
            "How has rainfall correlated with traffic congestion?",
            "What explains recent City Health score changes?"
        ]
    elif request.page_context == "prediction":
        followups = [
            "Why does the ML model predict this risk horizon?",
            "Which feature importance is highest and why?",
            "What municipal precautions should be prioritized?"
        ]
    elif request.page_context == "simulation":
        followups = [
            "What happens if rainfall increases by 100%?",
            "How does drainage efficiency affect this scenario?",
            "Compare current state with worst-case scenario."
        ]

    return ChatResponse(
        reply=reply_text,
        city_id=request.city_id,
        page_context=request.page_context,
        data_classification=list(set(data_classifications)),
        suggested_followups=followups,
        status="success"
    )
