from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.auth.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.database.connection import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service currently unavailable"
        )
    
    # Check existing user
    existing_user = await db["users"].find_one({"email": request.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    
    hashed_pwd = get_password_hash(request.password)
    user_doc = {
        "name": request.name.strip(),
        "email": request.email.lower().strip(),
        "password_hash": hashed_pwd,
        "role": request.role or "urban_planner",
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }
    
    result = await db["users"].insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    token = create_access_token(data={"sub": user_doc["email"], "name": user_doc["name"], "role": user_doc["role"]})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": user_id,
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"]
        }
    )

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service currently unavailable"
        )
    
    user = await db["users"].find_one({"email": request.email.lower().strip()})
    if not user or not verify_password(request.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    token = create_access_token(data={"sub": user["email"], "name": user["name"], "role": user.get("role", "urban_planner")})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "urban_planner")
        }
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.get("id") or current_user.get("_id")),
        name=current_user.get("name", "Urban Analyst"),
        email=current_user.get("email"),
        role=current_user.get("role", "urban_planner"),
        created_at=current_user.get("created_at") or datetime.utcnow()
    )
