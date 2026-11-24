import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class KnownEmail(Base):
    """
    Global registry of known / already-used email addresses.
    Any email added here will be flagged as 'Known Duplicate'
    when it appears in a future verification job.
    """
    __tablename__ = "known_emails"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    normalized_email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    original_email: Mapped[str] = mapped_column(String(320), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=True)   # optional tag / note
    added_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
