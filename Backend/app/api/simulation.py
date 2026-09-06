from fastapi import APIRouter, HTTPException, status
from app.schemas.simulation import SimulationRequest, SimulationResponse
from app.api.telemetry import assemble_city_telemetry
from app.simulation.engine import run_simulation
from app.gemini.client import gemini_service
from app.gemini.prompts import build_simulation_explanation_prompt

router = APIRouter(prefix="/api/simulation", tags=["What-If Simulation"])

@router.post("", response_model=SimulationResponse)
async def execute_simulation(params: SimulationRequest):
    # 1. Fetch current real city telemetry
    telemetry = await assemble_city_telemetry(params.city_id)
    
    # 2. Run deterministic simulation engine
    sim_result = run_simulation(telemetry, params)
    
    # 3. Call Gemini to explain the structured simulation comparison
    gemini_prompt = build_simulation_explanation_prompt(
        city_name=sim_result.city_name,
        scenario_title=sim_result.scenario_title,
        current_state=sim_result.current_state,
        simulated_state=sim_result.simulated_state,
        comparison_table=[row.model_dump() for row in sim_result.comparison_table]
    )
    explanation = await gemini_service.generate_response(gemini_prompt)
    sim_result.gemini_explanation = explanation

    # 4. Add structured recommendations
    recommendations = []
    if params.rainfall_delta_pct > 30:
        recommendations.append("Activate secondary floodwater retention reservoirs and clear drainage culverts.")
    if params.traffic_delta_pct > 20:
        recommendations.append("Implement high-occupancy lane prioritization and divert heavy freight routes.")
    if params.drainage_efficiency < 0.8:
        recommendations.append("Urgent desilting required in storm runoff canals before rainfall onset.")
    if not recommendations:
        recommendations.append("Maintain standard municipal sensor telemetry monitoring intervals.")
        
    sim_result.actionable_recommendations = recommendations

    return sim_result
