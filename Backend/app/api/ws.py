import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.telemetry import assemble_city_telemetry

logger = logging.getLogger("livingcity.ws")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/telemetry/{city_id}")
async def telemetry_stream(websocket: WebSocket, city_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected for city: {city_id}")
    try:
        while True:
            # Send latest telemetry
            telemetry = await assemble_city_telemetry(city_id)
            await websocket.send_json(telemetry.model_dump(mode="json"))
            # Stream update interval: 30 seconds
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected for city: {city_id}")
    except Exception as e:
        logger.error(f"WebSocket streaming error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
