SYSTEM_INSTRUCTION = """You are the Living City Urban AI Assistant.

Your purpose is to explain and analyze information supplied by the Living City backend.

Use only the structured city data, derived indicators, machine-learning results, simulation results, and historical observations provided to you.

Never invent missing weather values, traffic values, AQI, rainfall, historical data, sensor readings, ML predictions, model accuracy, simulation outcomes, or city statistics.

Machine-learning predictions come from the ML models.
Simulation results come from the simulation engine.

Your role is to explain relationships, summarize conditions, compare results, explain predictions, interpret trends, and provide contextual recommendations.

If required information is unavailable, clearly say that the information is unavailable.

Recommendations are considerations for human decision-makers and must not be presented as autonomous decisions.

Be concise, professional, evidence-based, transparent, and easy for urban decision-makers to understand. Always maintain a tone appropriate for municipal authorities, city planners, and civil defense coordinators."""


def build_ml_explanation_prompt(city_name: str, current_condition: dict, ml_result: dict) -> str:
    return f"""Context for City: {city_name}
Current Condition:
- Weather: {current_condition.get('weather_condition', 'N/A')}, Temp: {current_condition.get('temperature', 'N/A')}°C, Rainfall 1h: {current_condition.get('rainfall_1h', '0')} mm
- Derived Flood Risk: {current_condition.get('flood_level', 'Low')} (Score: {current_condition.get('flood_score', 0)})
- Traffic Congestion: {current_condition.get('congestion_pct', 0)}% ({current_condition.get('traffic_level', 'Low')})

Machine Learning Model Results (RandomForest):
- Predicted Risk Label: {ml_result.get('predicted_label')}
- Confidence: {ml_result.get('confidence_score', 'N/A')}
- Key Contributing Factors: {ml_result.get('feature_importances', [])}

Task:
Provide a concise, 2-paragraph decision-support explanation:
1. Explain the underlying factors driving the ML prediction.
2. Provide 3 specific municipal considerations/monitoring priorities for city authorities.
Do not invent unverified numbers or claims."""


def build_simulation_explanation_prompt(city_name: str, scenario_title: str, current_state: dict, simulated_state: dict, comparison_table: list) -> str:
    table_str = "\n".join([f"- {row['indicator']}: Current {row['current_value']} -> Simulated {row['simulated_value']} (Change: {row['change']})" for row in comparison_table])
    
    return f"""Context for City: {city_name}
Scenario: {scenario_title}

Indicators Comparison:
{table_str}

Task:
Analyze this What-If stress test:
1. Explain how the simulated parameter changes impact derived flood risk, traffic flow, and city health.
2. Outline key vulnerabilities exposed by this scenario.
3. Suggest 2-3 precautionary operational measures for municipal planners.
Reminder: This is a scenario simulation estimate, not a guaranteed prediction."""


def build_chat_prompt(
    city_name: str,
    page_context: str,
    current_data: dict,
    simulation_context: dict,
    user_message: str
) -> str:
    context_blocks = [
        f"Active City: {city_name}",
        f"Active Page/View: {page_context.upper()}",
        f"Real-Time Telemetry & Indicators:\n{current_data}"
    ]
    
    if simulation_context:
        context_blocks.append(f"Recent Simulation Context:\n{simulation_context}")
        
    context_str = "\n\n".join(context_blocks)
    
    return f"""Structured Backend Urban Intelligence:
{context_str}

User Question: "{user_message}"

Respond strictly using the verified information above. If the question asks about data that is unavailable, state clearly that it is unavailable. Clarify whether information represents a Real Observation, Derived Indicator, ML Prediction, or Simulation Result when relevant."""
