from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from app.schemas.ml import PredictionResponse, FeatureImportance, ModelEvaluationMetrics
from app.services.city_catalog import get_city_metadata
from app.services.weather_service import fetch_weather_data
from app.services.traffic_service import fetch_traffic_data
from app.services.derived_service import calculate_derived_flood_risk
from app.ml.pipeline import predict_flood, predict_traffic
from app.gemini.client import gemini_service
from app.gemini.prompts import build_ml_explanation_prompt

router = APIRouter(prefix="/api/prediction", tags=["Machine Learning Predictions"])

@router.get("/flood/{city_id}", response_model=PredictionResponse)
async def get_flood_prediction(city_id: str):
    city = get_city_metadata(city_id)
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City '{city_id}' not found."
        )

    weather = await fetch_weather_data(city_id)
    flood_risk = calculate_derived_flood_risk(weather)

    # Features for ML model
    r_1h = weather.rainfall_1h or 1.5
    f_3h = weather.forecast_rain_3h or 3.0
    hum = weather.humidity or 65.0
    clouds = weather.cloudiness or 40.0
    f_24h = weather.forecast_rain_24h or 8.0
    temp = weather.temperature or 28.0

    # 1. Run scikit-learn model
    ml_output = predict_flood(
        rainfall_1h=r_1h,
        forecast_3h=f_3h,
        humidity=hum,
        cloudiness=clouds,
        rainfall_24h=f_24h,
        temperature=temp
    )

    current_condition = {
        "weather_condition": weather.weather_condition,
        "temperature": temp,
        "rainfall_1h": r_1h,
        "forecast_3h": f_3h,
        "flood_score": flood_risk.score,
        "flood_level": flood_risk.level,
        "data_status": weather.status
    }

    # 2. Call Gemini for natural language explanation of the ML output
    gemini_prompt = build_ml_explanation_prompt(
        city_name=city.name,
        current_condition=current_condition,
        ml_result=ml_output
    )
    gemini_explanation = await gemini_service.generate_response(gemini_prompt)

    impact_summary = (
        f"The RandomForestClassifier model predicts a {ml_output['predicted_label']} flood risk horizon over the next 3-6 hours. "
        f"Primary risk driver is {ml_output['feature_importances'][0].feature_name} "
        f"(importance: {ml_output['feature_importances'][0].importance * 100:.1f}%)."
    )

    considerations = [
        "Monitor storm sewer outfalls and drainage canal gates in identified catchment basins.",
        "Ensure municipal pump stations maintain standby power and automatic siphon readiness.",
        "Coordinate with traffic management if surface pooling approaches major arterial corridors."
    ]

    return PredictionResponse(
        status="success",
        city_id=city.id,
        prediction_type="flood",
        prediction_horizon="Next 3-6 Hours",
        current_condition=current_condition,
        predicted_value=ml_output["predicted_class"],
        predicted_label=ml_output["predicted_label"],
        confidence_score=ml_output["confidence_score"],
        feature_importances=ml_output["feature_importances"],
        model_metrics=ml_output["metrics"],
        gemini_explanation=gemini_explanation,
        potential_impact=impact_summary,
        recommended_considerations=considerations,
        timestamp=datetime.utcnow()
    )


@router.get("/traffic/{city_id}", response_model=PredictionResponse)
async def get_traffic_prediction(city_id: str):
    city = get_city_metadata(city_id)
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City '{city_id}' not found."
        )

    traffic = await fetch_traffic_data(city_id)
    weather = await fetch_weather_data(city_id)
    
    now = datetime.utcnow()
    hour = (now.hour + 5) % 24 # rough IST or local
    is_weekend = 1 if now.weekday() >= 5 else 0
    rain = weather.rainfall_1h or 0.0
    ff_speed = traffic.free_flow_speed or 50.0
    curr_speed = traffic.current_speed or 38.0

    # 1. Run scikit-learn model
    ml_output = predict_traffic(
        hour_of_day=hour,
        is_weekend=is_weekend,
        rainfall_1h=rain,
        free_flow_speed=ff_speed,
        current_speed=curr_speed
    )

    current_condition = {
        "current_speed": curr_speed,
        "free_flow_speed": ff_speed,
        "current_congestion_pct": traffic.congestion_percentage or 24.0,
        "traffic_level": traffic.traffic_level,
        "hour_of_day": hour,
        "is_weekend": bool(is_weekend)
    }

    # 2. Call Gemini
    gemini_prompt = build_ml_explanation_prompt(
        city_name=city.name,
        current_condition=current_condition,
        ml_result=ml_output
    )
    gemini_explanation = await gemini_service.generate_response(gemini_prompt)

    impact_summary = (
        f"The RandomForestRegressor model predicts road congestion of {ml_output['predicted_congestion_pct']}% "
        f"({ml_output['predicted_label']} level) for the upcoming 60-minute window."
    )

    considerations = [
        "Optimize adaptive traffic signal timings along primary radial corridors.",
        "Deploy rapid-response traffic wardens to choke-point intersections.",
        "Issue real-time commuter advisories via digital variable message signs (VMS)."
    ]

    return PredictionResponse(
        status="success",
        city_id=city.id,
        prediction_type="traffic",
        prediction_horizon="Next 1 Hour",
        current_condition=current_condition,
        predicted_value=ml_output["predicted_congestion_ratio"],
        predicted_label=ml_output["predicted_label"],
        confidence_score=round(1.0 - (ml_output["metrics"].mae or 0.05), 3),
        feature_importances=ml_output["feature_importances"],
        model_metrics=ml_output["metrics"],
        gemini_explanation=gemini_explanation,
        potential_impact=impact_summary,
        recommended_considerations=considerations,
        timestamp=datetime.utcnow()
    )
