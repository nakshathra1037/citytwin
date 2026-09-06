from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class SimulationRequest(BaseModel):
    city_id: str
    rainfall_delta_pct: float = Field(0.0, description="Percentage change in rainfall (-100 to +300%)")
    traffic_delta_pct: float = Field(0.0, description="Percentage change in traffic flow (-80 to +200%)")
    drainage_efficiency: float = Field(1.0, description="Drainage capacity factor (0.4 clogged to 1.5 upgraded)")
    scenario_description: Optional[str] = "Custom Scenario"

class ComparisonRow(BaseModel):
    indicator: str
    unit: str
    current_value: str
    simulated_value: str
    change: str
    risk_direction: str # "neutral", "worse", "better"

class SimulationResponse(BaseModel):
    status: str = "success"
    scenario_title: str
    city_id: str
    city_name: str
    execution_timestamp: datetime = datetime.utcnow()
    
    # Mathematical comparison table
    comparison_table: List[ComparisonRow]
    
    # State snapshots
    current_state: Dict[str, Any]
    simulated_state: Dict[str, Any]
    
    # Gemini Decision Support Explanation
    gemini_explanation: Optional[str] = None
    actionable_recommendations: Optional[List[str]] = None
    
    disclaimer: str = "What-If Simulation results are deterministic scenario estimates for municipal decision support, not guaranteed real-world outcomes."
