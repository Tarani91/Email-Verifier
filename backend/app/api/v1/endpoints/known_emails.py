from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.repositories.known_email_repository import KnownEmailRepository
from app.validators.syntax_validator import normalize_email_string, validate_syntax

router = APIRouter()


# ── Pydantic schemas ────────────────────────────────────────────────────────

class KnownEmailAddItem(BaseModel):
    email: str
    label: Optional[str] = None


class KnownEmailBulkRequest(BaseModel):
    emails: List[KnownEmailAddItem]


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/known-emails/add")
async def add_known_emails(
    payload: KnownEmailBulkRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Add one or more emails to the global Known-Email registry.
    Duplicates within the registry are silently skipped.
    """
    repo = KnownEmailRepository(db)
    entries = []
    invalid = []

    for item in payload.emails:
        raw = item.email.strip()
        normalized = normalize_email_string(raw)
        is_valid, _, _ = validate_syntax(normalized)
        if not is_valid:
            invalid.append(raw)
            continue
        entries.append({
            "original_email": raw,
            "normalized_email": normalized,
            "label": item.label
        })

    result = {"added": 0, "skipped": 0, "invalid": invalid}
    if entries:
        counts = await repo.add_emails(entries)
        result["added"] = counts["added"]
        result["skipped"] = counts["skipped"]

    return result


@router.get("/known-emails")
async def list_known_emails(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List all known emails with optional search and pagination."""
    repo = KnownEmailRepository(db)
    offset = (page - 1) * limit
    records, total = await repo.list_emails(limit=limit, offset=offset, search=search)
    total_pages = (total + limit - 1) // limit if limit > 0 else 1

    return {
        "items": [
            {
                "id": r.id,
                "original_email": r.original_email,
                "normalized_email": r.normalized_email,
                "label": r.label,
                "added_at": r.added_at,
            }
            for r in records
        ],
        "total": total,
        "page": page,
        "total_pages": total_pages,
    }


@router.get("/known-emails/stats")
async def known_email_stats(db: AsyncSession = Depends(get_db)):
    """Return total count of known emails in the registry."""
    repo = KnownEmailRepository(db)
    total = await repo.total_count()
    return {"total": total}


@router.delete("/known-emails/{email_id}")
async def delete_known_email(email_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a single email from the registry by its ID."""
    repo = KnownEmailRepository(db)
    deleted = await repo.delete_email(email_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Known email not found.")
    return {"message": "Deleted successfully."}


@router.delete("/known-emails")
async def clear_known_emails(db: AsyncSession = Depends(get_db)):
    """Remove ALL emails from the registry."""
    repo = KnownEmailRepository(db)
    count = await repo.clear_all()
    return {"message": f"Cleared {count} known emails from the registry."}
