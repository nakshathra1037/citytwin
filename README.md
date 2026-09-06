# Living City — Smart City Digital Twin & Urban AI Decision Support Platform

**Living City** is an enterprise-grade Smart City Digital Twin and Urban AI Decision Support Platform designed to support city planners, municipal authorities, civil defense coordinators, and urban researchers.

The platform strictly adheres to the core paradigm:
**OBSERVE → ANALYZE → PREDICT → SIMULATE → EXPLAIN → SUPPORT DECISIONS**

---

## 🏛️ Architecture Overview

```
                          ┌────────────────────────────────────────────────────────┐
                          │            Living City React + Vite Frontend           │
                          │ ┌───────────────┬─────────────────┬──────────────────┐ │
                          │ │ Dashboard     │ Live 3D Twin    │ Analytics Charts │ │
                          │ │ (Telemetry)   │ (CesiumJS 3D)   │ (Observations)   │ │
                          │ ├───────────────┼─────────────────┼──────────────────┤ │
                          │ │ ML Prediction │ What-If Sim     │ Urban AI Chatbot │ │
                          │ │ (RandomForest)│ (Scenario Eng.) │ (Context-Aware)  │ │
                          │ └───────────────┴─────────────────┴──────────────────┘ │
                          └───────────────────────────▲────────────────────────────┘
                                                      │ REST / WebSocket
                          ┌───────────────────────────▼────────────────────────────┐
                          │               FastAPI Modular Backend                  │
                          │ ┌───────────────┬─────────────────┬──────────────────┐ │
                          │ │ Auth / JWT    │ External APIs   │ Derived Engine   │ │
                          │ │ (Bcrypt)      │ (OpenWeather,   │ (Flood Risk,     │ │
                          │ │               │  TomTom, AQI)   │  City Health)    │ │
                          │ ├───────────────┼─────────────────┼──────────────────┤ │
                          │ │ scikit-learn  │ What-If Engine  │ Gemini Service   │ │
                          │ │ ML Models     │ (Physics-based) │ (Explanations &  │ │
                          │ │ (Train/Infer) │ (Delta Comp.)   │  AI Assistant)   │ │
                          │ └───────────────┴─────────────────┴──────────────────┘ │
                          └─────────────▲────────────────────────────▲─────────────┘
                                        │                            │
                               ┌────────▼────────┐          ┌────────▼────────┐
                               │ MongoDB Database│          │ External APIs   │
                               │ - users         │          │ - OpenWeather   │
                               │ - observations  │          │ - TomTom        │
                               │ - models_meta   │          │ - Google Gemini │
                               └─────────────────┘          └─────────────────┘
```

---

## ✨ Core Features

1. **Enterprise Municipal Authentication**
   - Secure registration & login with Bcrypt password hashing and JWT authorization.
   - Role-based permissions (Urban Planner, Disaster Management, Municipal Commissioner).

2. **Strict Data Integrity Policy**
   - Zero fabricated sensor readings or random values.
   - Clear provenance tags for all information: *Real API Data*, *Derived Indicators*, *Machine Learning Outputs*, *Simulated Scenarios*, and *Gemini Grounded Explanations*.

3. **3D Live Digital Twin (CesiumJS)**
   - 3D geospatial visualization with multi-axis camera controls (pan, tilt, zoom, rotate).
   - City corridor network styled by real-time traffic flow (Green = Low, Yellow = Moderate, Red = High).
   - 3D spatial flood catchment polygons with derived risk coloring and elevation baselines.
   - Telemetry HUD overlay with live stats and navigation controls dock.

4. **Deterministic Derived Indicators**
   - **Derived Flood Risk:** Documented formula based on active precipitation, 3h/24h forecasts, atmospheric saturation, and cloud density:
     $$\text{Score} = (R_{1h} \times 0.35) + (R_{f3h} \times 0.30) + (\text{Humidity} \times 0.15) + (\text{Cloudiness} \times 0.10) + (R_{24h} \times 0.10)$$
   - **City Health Score:** Holistic 0–100 index deducting transparent penalties for traffic congestion, flood risk, weather severity, and AQI pollution.

5. **Historical Analytics & MongoDB Logging**
   - Automated timestamped logging of verified urban observations into MongoDB `city_observations`.
   - Dual-axis Chart.js trend charts for meteorological conditions, urban stress, and City Health progression.

6. **Machine Learning Predictive Intelligence (scikit-learn)**
   - `RandomForestClassifier`: Predicts 3–6 hour flood risk horizons (Test Accuracy: 97.0%, F1: 0.9699).
   - `RandomForestRegressor`: Predicts 1-hour ahead traffic congestion ($R^2 = 0.9957$, MAE: 0.0069).
   - Real-time feature importances and evaluation metrics displayed transparently.

7. **What-If Urban Scenario Simulation Engine**
   - Stress-test urban infrastructure by adjusting precipitation volume (+50% baseline), traffic volume, and drainage efficiency factor.
   - Recalculates indicators deterministically and displays side-by-side comparison tables with risk directions.

8. **Living City Urban AI Assistant (Google Gemini)**
   - Context-aware chatbot side drawer available across all authenticated views.
   - Grounded strictly on structured backend outputs (no hallucinated city data).
   - Automatically understands active page context and runs simulation comparisons when hypothetical questions are asked.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Vanilla CSS design tokens (Command Center Dark Theme)
- **3D Geospatial Engine:** CesiumJS (`vite-plugin-cesium`)
- **Charts:** Chart.js + `react-chartjs-2`
- **Icons:** Lucide React
- **HTTP Client:** Axios with JWT request interceptors

### Backend
- **Framework:** Python 3.12 + FastAPI + Uvicorn
- **Database:** MongoDB with async `motor` driver
- **Authentication:** Bcrypt + PyJWT
- **Machine Learning:** scikit-learn, pandas, numpy, joblib
- **Generative AI:** Google Gemini API (`google-genai`)
- **External Data:** OpenWeather API, TomTom Traffic API, OpenAQ / OpenWeather Air Pollution API

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)
- MongoDB running locally on port `27017`

### 2. Backend Setup
```bash
cd Backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Seed initial baseline observations & default user
python -m app.database.seed_data

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd Frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

- Open **`http://127.0.0.1:5173`** in your browser.
- **Default Credentials:**
  - **Email:** `planner@livingcity.gov`
  - **Password:** `citytwin2026`

---

## 📄 License
This project is licensed under the MIT License.
