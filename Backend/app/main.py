import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.auth.router import router as auth_router
from app.api.cities import router as cities_router
from app.api.telemetry import router as telemetry_router
from app.api.analytics import router as analytics_router
from app.api.prediction import router as prediction_router
from app.api.simulation import router as simulation_router
from app.api.chat import router as chat_router
from app.api.ws import router as ws_router
from app.ml.pipeline import train_and_persist_models

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("livingcity.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Living City Backend Services...")
    await connect_to_mongo()
    # Ensure ML models are loaded / trained
    try:
        train_and_persist_models()
    except Exception as e:
        logger.error(f"Error ensuring ML models: {e}")
    yield
    # Shutdown
    logger.info("Shutting down Living City Backend Services...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.APP_NAME,
    description="Smart City Digital Twin & Urban AI Decision Support Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(cities_router)
app.include_router(telemetry_router)
app.include_router(analytics_router)
app.include_router(prediction_router)
app.include_router(simulation_router)
app.include_router(chat_router)
app.include_router(ws_router)

@app.get("/")
async def root():
    return {
        "platform": settings.APP_NAME,
        "status": "online",
        "paradigm": "OBSERVE -> ANALYZE -> PREDICT -> SIMULATE -> EXPLAIN -> SUPPORT DECISIONS",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app_env": settings.APP_ENV,
        "debug": settings.DEBUG
    }
