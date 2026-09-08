import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class VerificationJob(Base):
    __tablename__ = "verification_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    
    total_emails: Mapped[int] = mapped_column(Integer, default=0)
    processed_emails: Mapped[int] = mapped_column(Integer, default=0)
    
    valid_count: Mapped[int] = mapped_column(Integer, default=0)
    invalid_count: Mapped[int] = mapped_column(Integer, default=0)
    disposable_count: Mapped[int] = mapped_column(Integer, default=0)
    role_count: Mapped[int] = mapped_column(Integer, default=0)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0)
    free_count: Mapped[int] = mapped_column(Integer, default=0)
    business_count: Mapped[int] = mapped_column(Integer, default=0)
    no_mx_count: Mapped[int] = mapped_column(Integer, default=0)
    
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, processing, completed, failed
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    records = relationship("EmailRecord", back_populates="job", cascade="all, delete-orphan")
