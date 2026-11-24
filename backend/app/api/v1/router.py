from fastapi import APIRouter
from app.api.v1.endpoints import health, verification, known_emails

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(verification.router, tags=["Verification"])
api_router.include_router(known_emails.router, tags=["Known Emails"])
