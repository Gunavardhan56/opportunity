from datetime import datetime, timedelta
import csv
import io
import os

import requests
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from app.database import opportunities_collection, reminders_collection
from app.message_parser import parse_message
from app.routes.opportunity_routes import normalize_message, _store_opportunity_and_matches

load_dotenv()

scheduler = BackgroundScheduler()


def _parse_iso_datetime(value: str):
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return None


def check_deadlines():
    """
    Periodic job that looks for opportunities with deadlines approaching soon
    and creates reminder entries in MongoDB.
    """
    now = datetime.utcnow()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    upcoming = start_of_today + timedelta(days=3)

    cursor = opportunities_collection.find({"deadline_date": {"$exists": True}})
    for opp in cursor:
        deadline_str = opp.get("deadline_date")
        if not deadline_str:
            continue

        deadline_dt = _parse_iso_datetime(deadline_str)
        if not deadline_dt:
            continue

        if start_of_today <= deadline_dt < upcoming:
            existing = reminders_collection.find_one(
                {
                    "type": "deadline_soon",
                    "opportunity_id": opp.get("_id"),
                }
            )
            if existing:
                continue

            reminders_collection.insert_one(
                {
                    "type": "deadline_soon",
                    "opportunity_id": opp.get("_id"),
                    "created_at": now,
                    "deadline": deadline_dt,
                    "status": "pending",
                }
            )


def process_reminders():
    """
    Periodic job that processes pending reminders.
    In a full system this would send Telegram/email/push notifications.
    Here it marks reminders as 'sent' to complete the pipeline.
    """
    now = datetime.utcnow()
    cursor = reminders_collection.find(
        {"$or": [{"status": {"$exists": False}}, {"status": "pending"}]}
    )
    for reminder in cursor:
        reminders_collection.update_one(
            {"_id": reminder["_id"]},
            {
                "$set": {
                    "status": "sent",
                    "sent_at": now,
                }
            },
        )


def start_scheduler():
    if not scheduler.get_jobs():
        scheduler.add_job(check_deadlines, "interval", hours=1)
        scheduler.add_job(process_reminders, "interval", minutes=5)
        # Optional: ingest opportunities from a Google Sheet exported as CSV.
        sheet_url = os.getenv("GOOGLE_SHEET_CSV_URL", "").strip()
        if sheet_url:
            interval_seconds = int(os.getenv("GOOGLE_SHEET_POLL_SECONDS", "60"))
            scheduler.add_job(
                ingest_google_sheet_csv,
                "interval",
                seconds=max(20, interval_seconds),
                kwargs={"csv_url": sheet_url},
            )
    scheduler.start()


def ingest_google_sheet_csv(csv_url: str):
    """
    Pull a published Google Sheet as CSV and ingest each row as an opportunity message.
    Enabled only when GOOGLE_SHEET_CSV_URL is set.
    Duplicate protection relies on existing (company, role, link) unique index.
    """
    try:
        resp = requests.get(csv_url, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print("Google Sheet ingestion failed to fetch CSV:", str(e))
        return {"status": "fetch_failed"}

    text = resp.text or ""
    if not text.strip():
        return {"status": "empty"}

    reader = csv.DictReader(io.StringIO(text))
    ingested = 0
    skipped = 0

    for row in reader:
        company = (row.get("Company") or row.get("company") or "").strip()
        role = (row.get("Role") or row.get("role") or "").strip()
        deadline = (row.get("Deadline") or row.get("deadline") or "").strip()
        link = (row.get("Link") or row.get("link") or "").strip()
        subject = (row.get("Subject") or row.get("subject") or "").strip()

        parts = []
        if subject:
            parts.append(f"Subject: {subject}")
        if company:
            parts.append(f"Company: {company}")
        if role:
            parts.append(f"Role: {role}")
        if deadline:
            parts.append(f"Deadline: {deadline}")
        if link:
            parts.append(f"Link: {link}")

        message = "\n".join(parts).strip()
        if not message:
            skipped += 1
            continue

        normalized = normalize_message(message)
        parsed = parse_message(normalized)
        result = _store_opportunity_and_matches(parsed)
        if result.get("status") == "stored":
            ingested += 1
        else:
            skipped += 1

    return {"status": "ok", "ingested": ingested, "skipped": skipped}
