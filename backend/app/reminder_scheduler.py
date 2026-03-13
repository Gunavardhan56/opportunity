from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import opportunities_collection, reminders_collection

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
    scheduler.start()
