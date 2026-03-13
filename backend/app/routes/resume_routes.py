from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, UploadFile, HTTPException
from app.database import users_collection
from app.resume_parser import parse_resume
import tempfile
import shutil

router = APIRouter()


@router.post("/upload_resume")
async def upload_resume(file: UploadFile, user_id: Optional[str] = None):
    """
    Accept a PDF resume, extract a basic user profile, and store it in MongoDB.
    """
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        profile = parse_resume(tmp_path)

        update_fields = {
            "batch": profile.get("batch"),
            "skills": profile.get("skills", []),
            "profile_created": True,
        }

        # If a user_id is provided (from authenticated frontend), update that user.
        if user_id:
            try:
                user_obj_id = ObjectId(user_id)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid user_id.")

            result = users_collection.update_one(
                {"_id": user_obj_id}, {"$set": update_fields}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="User not found.")

            updated = users_collection.find_one({"_id": user_obj_id})
            user_response = None
            if updated:
                user_response = {
                    "id": str(updated["_id"]),
                    "name": updated.get("name"),
                    "email": updated.get("email"),
                    "skills": updated.get("skills", []),
                    "batch": updated.get("batch"),
                    "profile_created": updated.get("profile_created", False),
                    "telegram_connected": updated.get("telegram_connected", False),
                }

            return {
                "message": "Resume processed",
                "user_id": user_id,
                "profile": profile,
                "user": user_response,
            }

        # Backwards-compatible behavior: create a new user if no user_id was passed.
        user_doc = update_fields
        result = users_collection.insert_one(user_doc)

        return {
            "message": "Resume processed",
            "user_id": str(result.inserted_id),
            "profile": profile,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {e}")
