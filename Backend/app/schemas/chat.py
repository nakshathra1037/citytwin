from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatMessageItem(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    city_id: str
    page_context: str = "dashboard" # "dashboard", "digital_twin", "analytics", "prediction", "simulation"
    simulation_context: Optional[Dict[str, Any]] = None
    relevant_data_context: Optional[Dict[str, Any]] = None
    history: Optional[List[ChatMessageItem]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str
    city_id: str
    page_context: str
    data_classification: List[str] # ["Real Observation", "Derived Indicator", "ML Prediction", "Simulation Result", "Gemini Explanation"]
    suggested_followups: List[str] = []
    status: str = "success"
