from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserInDB(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    name: str
    password_hash: str
    role: str = "urban_planner" # e.g. "admin", "urban_planner", "analyst", "municipal_official"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Config:
        populate_by_name = True
