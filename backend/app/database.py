import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://mahantigunavardhan:Gunavardhanmongo@cluster0.vkfwu.mongodb.net/")

client = MongoClient(MONGO_URI)

db_name = os.getenv("MONGO_DB_NAME", "opportunity_system")
db = client[db_name]

users_collection = db["users"]
opportunities_collection = db["opportunities"]
reminders_collection = db["reminders"]
matches_collection = db["matches"]


def ensure_indexes():
    """
    Create important MongoDB indexes (idempotent).
    """
    try:
        opportunities_collection.create_index(
            [("company", 1), ("role", 1), ("link", 1)],
            unique=True,
            name="uniq_company_role_link",
        )
    except Exception:
        # Ignore index creation failures (e.g., existing duplicates) for now.
        pass
