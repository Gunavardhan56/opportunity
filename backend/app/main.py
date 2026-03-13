from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import resume_routes, opportunity_routes, auth_routes
from app.reminder_scheduler import start_scheduler
from app.database import (
    users_collection,
    opportunities_collection,
    matches_collection,
    reminders_collection,
    ensure_indexes,
)

app = FastAPI(
    title="Opportunity Intelligence API",
    description="Backend for parsing internship/job messages and matching eligibility",
    version="1.0",
)

# Allow frontend (Vite dev server) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup_event():
    ensure_indexes()
    start_scheduler()


app.include_router(resume_routes.router)
app.include_router(opportunity_routes.router)
app.include_router(auth_routes.router)


@app.get("/")
def home():
    return {"status": "Backend running"}


@app.get("/system_status")
def system_status():
    return {
        "users": users_collection.count_documents({}),
        "opportunities": opportunities_collection.count_documents({}),
        "matches": matches_collection.count_documents({}),
        "reminders": reminders_collection.count_documents({}),
    }
