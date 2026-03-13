from datetime import datetime, timedelta
import os
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from werkzeug.security import check_password_hash, generate_password_hash

from bson import ObjectId

from app.database import users_collection


router = APIRouter()
security = HTTPBearer(auto_error=False)


def _get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if not credentials or credentials.scheme != "Bearer":
        raise HTTPException(status_code=401, detail="Not authenticated.")
    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token.")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")


JWT_SECRET = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    skills: Optional[list[str]] = None
    batch: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPatchRequest(BaseModel):
    telegram_connected: Optional[bool] = None


def _create_access_token(user_id: str, email: str) -> str:
    now = datetime.utcnow()
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRES_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/register")
def register(payload: RegisterRequest):
    existing = users_collection.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    password_hash = generate_password_hash(payload.password)

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": password_hash,
        "skills": payload.skills or [],
        "batch": payload.batch,
        "profile_created": False,
        "telegram_connected": False,
        "created_at": datetime.utcnow(),
    }

    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = _create_access_token(user_id=user_id, email=payload.email)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": payload.name,
            "email": payload.email,
            "skills": user_doc["skills"],
            "batch": user_doc["batch"],
            "profile_created": user_doc["profile_created"],
            "telegram_connected": user_doc["telegram_connected"],
        },
    }


@router.post("/login")
def login(payload: LoginRequest):
    user = users_collection.find_one({"email": payload.email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not check_password_hash(user["password_hash"], payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = str(user["_id"])
    token = _create_access_token(user_id=user_id, email=user["email"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user.get("name"),
            "email": user.get("email"),
            "skills": user.get("skills", []),
            "batch": user.get("batch"),
            "profile_created": user.get("profile_created", False),
            "telegram_connected": user.get("telegram_connected", False),
        },
    }


@router.patch("/user/{user_id}")
def patch_user(user_id: str, payload: UserPatchRequest):
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id.")

    user = users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    update_fields = {}
    if payload.telegram_connected is not None:
        update_fields["telegram_connected"] = payload.telegram_connected

    if not update_fields:
        return {"message": "No updates applied", "user_id": user_id}

    users_collection.update_one(
        {"_id": user_obj_id}, {"$set": update_fields}
    )
    return {"message": "User updated", "user_id": user_id}


@router.get("/me")
def get_me(user_id: str = Depends(_get_current_user_id)):
    """Return the current user from DB (skills, profile_created, etc.) so frontend can sync after refresh or on another device."""
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user.")
    user = users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "skills": user.get("skills", []),
        "batch": user.get("batch"),
        "profile_created": user.get("profile_created", False),
        "telegram_connected": user.get("telegram_connected", False),
    }

