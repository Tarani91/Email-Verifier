import uuid
from sqlalchemy import String, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class EmailRecord(Base):
    __tablename__ = "email_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("verification_jobs.id", ondelete="CASCADE"), nullable=False)
    
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    original_email: Mapped[str] = mapped_column(String(320), nullable=False)
    normalized_email: Mapped[str] = mapped_column(String(320), nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    domain: Mapped[str] = mapped_column(String(255), nullable=True)
    
    has_mx_record: Mapped[bool] = mapped_column(Boolean, default=False)
    is_disposable: Mapped[bool] = mapped_column(Boolean, default=False)
    is_role_account: Mapped[bool] = mapped_column(Boolean, default=False)
    is_free_provider: Mapped[bool] = mapped_column(Boolean, default=False)
    is_business_email: Mapped[bool] = mapped_column(Boolean, default=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    is_known_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    is_syntax_valid: Mapped[bool] = mapped_column(Boolean, default=False)

    job = relationship("VerificationJob", back_populates="records")
