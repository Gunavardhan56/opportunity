from datetime import datetime
from typing import Any, Dict, List, Optional
import re

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import (
    opportunities_collection,
    users_collection,
    matches_collection,
    reminders_collection,
)
from app.message_parser import parse_message
from app.eligibility_engine import check_eligibility
from app.scraper import extract_deadline_from_page

router = APIRouter()


class OpportunityMessage(BaseModel):
    message: str


def normalize_message(text: str) -> str:
    """
    Normalize raw opportunity messages from Telegram/email/etc.
    - Convert Windows newlines \\r\\n to \\n
    - Collapse multiple spaces/tabs into a single space
    - Collapse multiple blank lines into a single newline
    - Trim leading/trailing whitespace
    """
    if not text:
        return ""

    text = text.replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n+", "\n", text)
    text = text.strip()
    return text


def _parse_deadline_to_date(deadline: Optional[str]) -> Optional[datetime]:
    if not deadline:
        return None

    from datetime import datetime as _dt

    patterns = [
        "%b %d %Y",
        "%b %d",
        "%B %d %Y",
        "%B %d",
        "%Y-%m-%d",
    ]

    for pattern in patterns:
        try:
            dt = _dt.strptime(deadline, pattern)
            if "%Y" not in pattern:
                dt = dt.replace(year=_dt.utcnow().year)
            return dt
        except ValueError:
            continue
    return None


def _is_duplicate(parsed: Dict[str, Any]) -> bool:
    company = parsed.get("company")
    role = parsed.get("role")
    link = parsed.get("link")

    if not (company and role and link):
        return False

    existing = opportunities_collection.find_one(
        {"company": company, "role": role, "link": link}
    )
    return existing is not None


def _enrich_with_scraper(parsed: Dict[str, Any]) -> Dict[str, Any]:
    if not parsed.get("deadline") and parsed.get("link"):
        scraped_deadline = extract_deadline_from_page(parsed["link"])
        if scraped_deadline:
            parsed["deadline"] = scraped_deadline
    return parsed


def _store_opportunity_and_matches(parsed: Dict[str, Any]) -> Dict[str, Any]:
    parsed = _enrich_with_scraper(parsed)

    deadline_dt = _parse_deadline_to_date(parsed.get("deadline"))
    if deadline_dt:
        parsed["deadline_date"] = deadline_dt.isoformat()

    if _is_duplicate(parsed):
        return {"status": "duplicate_skipped", "data": parsed}

    parsed["created_at"] = datetime.utcnow()
    opp_result = opportunities_collection.insert_one(parsed)
    opportunity_id = opp_result.inserted_id

    matches: List[Dict[str, Any]] = []
    for user in users_collection.find():
        eligibility = check_eligibility(user, parsed)
        match_doc = {
            "user_id": user.get("_id"),
            "opportunity_id": opportunity_id,
            "eligible": eligibility["eligible"],
            "score": eligibility["score"],
            "created_at": datetime.utcnow(),
        }
        matches.append(match_doc)

        if eligibility["eligible"]:
            reminders_collection.insert_one(
                {
                    "type": "new_match",
                    "user_id": user.get("_id"),
                    "opportunity_id": opportunity_id,
                    "score": eligibility["score"],
                    "created_at": datetime.utcnow(),
                    "status": "pending",
                }
            )

    if matches:
        matches_collection.insert_many(matches)

    return {"status": "stored", "data": {**parsed, "_id": opportunity_id}}


def _serialize_object_id(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    return value


def _serialize_document(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _serialize_object_id(v) for k, v in doc.items()}


@router.post("/new_opportunity")
def new_opportunity(payload: OpportunityMessage):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Invalid message.")

    # Normalize the incoming message so all downstream processing
    # (parsing, duplicate detection, storage, eligibility) sees a
    # consistent representation, regardless of source formatting.
    normalized_message = normalize_message(payload.message)
    print("Normalized opportunity message:", normalized_message)

    if not normalized_message:
        raise HTTPException(status_code=400, detail="Invalid message.")

    parsed = parse_message(normalized_message)
    result = _store_opportunity_and_matches(parsed)
    result["data"] = _serialize_document(result["data"])
    return result


@router.post("/telegram_webhook")
def telegram_webhook(update: Dict[str, Any]):
    message = update.get("message") or {}
    text = message.get("text") or update.get("text")

    if not text:
        raise HTTPException(status_code=400, detail="No message text found in update.")

    parsed = parse_message(text)
    result = _store_opportunity_and_matches(parsed)
    result["data"] = _serialize_document(result["data"])
    return {"status": "processed", "result": result}


@router.get("/opportunities")
def list_opportunities():
    docs = list(opportunities_collection.find().sort("created_at", -1))
    return [_serialize_document(doc) for doc in docs]


@router.get("/opportunities/{opportunity_id}")
def get_opportunity(opportunity_id: str):
    try:
        obj_id = ObjectId(opportunity_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid opportunity_id.")

    doc = opportunities_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    return _serialize_document(doc)


@router.get("/deadline_soon")
def deadline_soon():
    from datetime import datetime as _dt, timedelta as _td

    now = _dt.utcnow()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    # Days 3 because we want "today + 2 days". So anything `< start_of_today + 3 days`
    upcoming = start_of_today + _td(days=3)

    docs = []
    for opp in opportunities_collection.find({"deadline_date": {"$exists": True}}):
        try:
            deadline = _dt.fromisoformat(opp["deadline_date"])
        except Exception:
            continue
        if start_of_today <= deadline < upcoming:
            docs.append(_serialize_document(opp))
    return docs


@router.get("/eligible_opportunities/{user_id}")
def eligible_opportunities(user_id: str):
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id.")

    matches = list(
        matches_collection.find(
            {"user_id": user_obj_id, "eligible": True}
        ).sort("score", -1)
    )

    opportunity_ids = [m["opportunity_id"] for m in matches]
    opportunities = {
        opp["_id"]: opp
        for opp in opportunities_collection.find({"_id": {"$in": opportunity_ids}})
    }

    response = []
    for m in matches:
        opp = opportunities.get(m["opportunity_id"])
        if not opp:
            continue
        item = {
            "match": _serialize_document(m),
            "opportunity": _serialize_document(opp),
        }
        response.append(item)
    return response


@router.get("/user_matches/{user_id}")
def user_matches(user_id: str):
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id.")

    matches = list(matches_collection.find({"user_id": user_obj_id}).sort("created_at", -1))

    opportunity_ids = [m["opportunity_id"] for m in matches]
    opportunities = {
        opp["_id"]: opp
        for opp in opportunities_collection.find({"_id": {"$in": opportunity_ids}})
    }

    response = []
    for m in matches:
        opp = opportunities.get(m["opportunity_id"])
        if not opp:
            continue
        item = {
            "match": _serialize_document(m),
            "opportunity": _serialize_document(opp),
        }
        response.append(item)
    return response

