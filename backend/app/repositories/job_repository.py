from typing import List, Optional, Tuple
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.verification_job import VerificationJob
from app.models.email_record import EmailRecord

class JobRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_job(
        self,
        filename: str,
        original_filename: str,
        file_path: str,
        total_emails: int
    ) -> VerificationJob:
        job = VerificationJob(
            filename=filename,
            original_filename=original_filename,
            file_path=file_path,
            total_emails=total_emails,
            status="pending"
        )
        self.session.add(job)
        await self.session.commit()
        await self.session.refresh(job)
        return job

    async def get_job_by_id(self, job_id: str) -> Optional[VerificationJob]:
        stmt = select(VerificationJob).where(VerificationJob.id == job_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_jobs(self, limit: int = 20, offset: int = 0) -> List[VerificationJob]:
        stmt = select(VerificationJob).order_by(VerificationJob.created_at.desc()).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_job_status(
        self,
        job_id: str,
        status: str,
        error_message: Optional[str] = None,
        completed_at = None
    ) -> None:
        values = {"status": status}
        if error_message is not None:
            values["error_message"] = error_message
        if completed_at is not None:
            values["completed_at"] = completed_at
            
        stmt = update(VerificationJob).where(VerificationJob.id == job_id).values(**values)
        await self.session.execute(stmt)
        await self.session.commit()

    async def update_job_progress_and_counts(
        self,
        job_id: str,
        processed_count: int,
        counts_update: dict
    ) -> None:
        values = {
            "processed_emails": processed_count,
            **counts_update
        }
        stmt = update(VerificationJob).where(VerificationJob.id == job_id).values(**values)
        await self.session.execute(stmt)
        await self.session.commit()

    async def bulk_create_records(self, records: List[EmailRecord]) -> None:
        self.session.add_all(records)
        await self.session.commit()

    async def get_records_by_job_id(
        self,
        job_id: str,
        limit: int = 100,
        offset: int = 0,
        status_filter: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> Tuple[List[EmailRecord], int]:
        stmt = select(EmailRecord).where(EmailRecord.job_id == job_id)
        
        if status_filter:
            stmt = stmt.where(EmailRecord.status == status_filter)
            
        if search_query:
            pattern = f"%{search_query.lower()}%"
            stmt = stmt.where(
                (EmailRecord.original_email.ilike(pattern)) |
                (EmailRecord.domain.ilike(pattern)) |
                (EmailRecord.status.ilike(pattern))
            )
            
        # Count total matching rows
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_matching = (await self.session.execute(count_stmt)).scalar() or 0
        
        # Paginated results ordered by row_index
        stmt = stmt.order_by(EmailRecord.row_index.asc()).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total_matching

    async def get_all_records_for_export(self, job_id: str) -> List[EmailRecord]:
        stmt = select(EmailRecord).where(EmailRecord.job_id == job_id).order_by(EmailRecord.row_index.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
