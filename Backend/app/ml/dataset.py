import os
import numpy as np
import pandas as pd
from typing import Tuple

def build_training_dataset(samples: int = 1200) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Builds structured meteorological and traffic dataset adhering to physical distributions
    (monsoon precipitation distributions, diurnal traffic cycles, saturation indices)
    used for training scikit-learn predictive models.
    """
    np.random.seed(42)
    
    # 1. Flood Risk Dataset
    # Features: rainfall_1h, forecast_3h, humidity, cloudiness, rainfall_24h, temp
    rainfall_1h = np.random.exponential(scale=3.5, size=samples) # exponential rain distribution
    forecast_3h = rainfall_1h * np.random.uniform(0.6, 2.5, size=samples)
    humidity = np.clip(np.random.normal(loc=72.0, scale=15.0, size=samples), 20.0, 100.0)
    cloudiness = np.clip(humidity * np.random.uniform(0.7, 1.2, size=samples), 0.0, 100.0)
    rainfall_24h = rainfall_1h * np.random.uniform(2.0, 8.0, size=samples)
    temperature = np.clip(np.random.normal(loc=28.0, scale=4.5, size=samples), 14.0, 42.0)
    
    # Ground truth physical flood risk index (0 - 100)
    continuous_risk = (
        (np.clip(rainfall_1h, 0, 35) / 35.0) * 35.0 +
        (np.clip(forecast_3h, 0, 45) / 45.0) * 30.0 +
        (humidity / 100.0) * 15.0 +
        (cloudiness / 100.0) * 10.0 +
        (np.clip(rainfall_24h, 0, 80) / 80.0) * 10.0 +
        np.random.normal(0, 2.0, size=samples)
    )
    continuous_risk = np.clip(continuous_risk, 0.0, 100.0)
    
    # Classification target: 0 = Low, 1 = Moderate, 2 = High
    flood_labels = np.where(continuous_risk < 35.0, 0, np.where(continuous_risk <= 70.0, 1, 2))
    
    df_flood = pd.DataFrame({
        "rainfall_1h": rainfall_1h,
        "forecast_3h": forecast_3h,
        "humidity": humidity,
        "cloudiness": cloudiness,
        "rainfall_24h": rainfall_24h,
        "temperature": temperature,
        "target_risk_score": continuous_risk,
        "target_risk_class": flood_labels
    })

    # 2. Traffic Dataset
    # Features: hour_of_day, is_weekend, current_speed, free_flow_speed, rain_intensity
    hours = np.random.randint(0, 24, size=samples)
    is_weekend = np.random.binomial(1, 0.28, size=samples)
    
    # Rush hour peaks: 8-10 AM and 5-8 PM
    rush_factor = np.exp(-((hours - 9.0)**2) / 4.0) + np.exp(-((hours - 18.0)**2) / 6.0)
    rush_factor = np.clip(rush_factor * (1.0 - is_weekend * 0.4), 0.0, 1.2)
    
    rain_effect = np.clip(rainfall_1h / 20.0, 0.0, 0.4)
    ff_speed = np.random.normal(loc=55.0, scale=4.0, size=samples)
    
    # Congestion ratio (0.0 to 1.0)
    target_congestion = np.clip(0.15 + (rush_factor * 0.45) + (rain_effect * 0.3) + np.random.normal(0, 0.05, size=samples), 0.05, 0.95)
    current_speed = ff_speed * (1.0 - target_congestion)
    
    df_traffic = pd.DataFrame({
        "hour_of_day": hours,
        "is_weekend": is_weekend,
        "rainfall_1h": rainfall_1h,
        "free_flow_speed": ff_speed,
        "current_speed": current_speed,
        "target_congestion": target_congestion
    })

    return df_flood, df_traffic
