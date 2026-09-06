from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.city import CityMetadata
from app.services.city_catalog import get_all_cities, get_city_metadata

router = APIRouter(prefix="/api/cities", tags=["Cities"])

@router.get("", response_model=List[CityMetadata])
async def list_cities():
    return get_all_cities()

@router.get("/{city_id}", response_model=CityMetadata)
async def get_city(city_id: str):
    city = get_city_metadata(city_id)
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City '{city_id}' not found in registry."
        )
    return city
