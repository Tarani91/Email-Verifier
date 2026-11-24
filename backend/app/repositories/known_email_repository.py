from typing import List, Optional, Tuple
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.models.known_email import KnownEmail


class KnownEmailRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_emails(self, entries: List[dict]) -> dict:
        """
        Bulk-upsert emails into the known registry.
        Each entry: { original_email, normalized_email, label? }
        Returns counts of added vs already-existing.
        """
        added = 0
        skipped = 0
        for entry in entries:
            norm = entry["normalized_email"]
            orig = entry["original_email"]
            label = entry.get("label")

            existing = await self.get_by_normalized(norm)
            if existing:
                skipped += 1
            else:
                record = KnownEmail(
                    normalized_email=norm,
                    original_email=orig,
                    label=label
                )
                self.session.add(record)
                added += 1

        await self.session.commit()
        return {"added": added, "skipped": skipped}

    async def get_by_normalized(self, normalized_email: str) -> Optional[KnownEmail]:
        stmt = select(KnownEmail).where(KnownEmail.normalized_email == normalized_email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_emails(
        self,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None
    ) -> Tuple[List[KnownEmail], int]:
        stmt = select(KnownEmail)
        if search:
            pattern = f"%{search.lower()}%"
            stmt = stmt.where(KnownEmail.normalized_email.ilike(pattern))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(KnownEmail.added_at.desc()).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def delete_email(self, email_id: str) -> bool:
        stmt = delete(KnownEmail).where(KnownEmail.id == email_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def clear_all(self) -> int:
        stmt = delete(KnownEmail)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount

    async def get_all_normalized_set(self) -> set:
        """Load all known emails into a Python set for fast lookup during verification."""
        stmt = select(KnownEmail.normalized_email)
        result = await self.session.execute(stmt)
        return set(result.scalars().all())

    async def total_count(self) -> int:
        stmt = select(func.count()).select_from(KnownEmail)
        return (await self.session.execute(stmt)).scalar() or 0
