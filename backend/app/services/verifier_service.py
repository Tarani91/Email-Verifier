import asyncio
import logging
from typing import List, Dict, Set
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.email_record import EmailRecord
from app.repositories.job_repository import JobRepository
from app.repositories.known_email_repository import KnownEmailRepository

from app.validators.syntax_validator import normalize_email_string, validate_syntax
from app.validators.dns_validator import check_domain_and_mx
from app.validators.disposable_validator import is_disposable_domain
from app.validators.role_validator import is_role_account
from app.validators.provider_validator import is_free_provider, is_business_email

logger = logging.getLogger("email_verifier")

async def process_single_email(
    item: Dict,
    job_id: str,
    seen_emails: Set[str],
    known_emails: Set[str],
    lock: asyncio.Lock,
    semaphore: asyncio.Semaphore
) -> EmailRecord:
    try:
        async with semaphore:
            row_index = item["row_index"]
            original_email = str(item.get("original_email", ""))
            
            # Step 2: Normalize
            normalized_email = normalize_email_string(original_email)
            
            # Step 8: Check duplicates within this job (Thread-safe check)
            is_duplicate = False
            async with lock:
                if normalized_email in seen_emails:
                    is_duplicate = True
                else:
                    if normalized_email:
                        seen_emails.add(normalized_email)

            # Check against global known-email registry
            is_known_duplicate = normalized_email in known_emails

            # Step 1: Validate Syntax
            is_syntax_valid, domain, syntax_reason = validate_syntax(normalized_email)

            if not is_syntax_valid:
                status = "Invalid Format"
                reason = f"Syntax error: {syntax_reason}"
                return EmailRecord(
                    job_id=job_id,
                    row_index=row_index,
                    original_email=original_email,
                    normalized_email=normalized_email,
                    status=status,
                    reason=reason,
                    domain=domain,
                    has_mx_record=False,
                    is_disposable=False,
                    is_role_account=False,
                    is_free_provider=False,
                    is_business_email=False,
                    is_duplicate=is_duplicate,
                    is_known_duplicate=is_known_duplicate,
                    is_syntax_valid=False
                )

            # Known Duplicate takes priority over in-job duplicate
            if is_known_duplicate:
                status = "Known Duplicate"
                reason = "Email already exists in the Known Emails registry"
                domain_exists, has_mx, primary_mx, dns_reason = await check_domain_and_mx(domain)
                disposable = is_disposable_domain(domain)
                role = is_role_account(normalized_email)
                free_prov = is_free_provider(domain)
                bus_email = is_business_email(domain, free_prov, disposable)

                return EmailRecord(
                    job_id=job_id,
                    row_index=row_index,
                    original_email=original_email,
                    normalized_email=normalized_email,
                    status=status,
                    reason=reason,
                    domain=domain,
                    has_mx_record=has_mx,
                    is_disposable=disposable,
                    is_role_account=role,
                    is_free_provider=free_prov,
                    is_business_email=bus_email,
                    is_duplicate=is_duplicate,
                    is_known_duplicate=True,
                    is_syntax_valid=True
                )

            if is_duplicate:
                status = "Duplicate"
                reason = "Duplicate email address found in file"
                # Still run secondary checks for domain
                domain_exists, has_mx, primary_mx, dns_reason = await check_domain_and_mx(domain)
                disposable = is_disposable_domain(domain)
                role = is_role_account(normalized_email)
                free_prov = is_free_provider(domain)
                bus_email = is_business_email(domain, free_prov, disposable)
                
                return EmailRecord(
                    job_id=job_id,
                    row_index=row_index,
                    original_email=original_email,
                    normalized_email=normalized_email,
                    status=status,
                    reason=reason,
                    domain=domain,
                    has_mx_record=has_mx,
                    is_disposable=disposable,
                    is_role_account=role,
                    is_free_provider=free_prov,
                    is_business_email=bus_email,
                    is_duplicate=True,
                    is_known_duplicate=False,
                    is_syntax_valid=True
                )

            # Step 3 & 4: Domain existence & MX record DNS lookup
            domain_exists, has_mx, primary_mx, dns_reason = await check_domain_and_mx(domain)

            # Step 5: Disposable check
            disposable = is_disposable_domain(domain)

            # Step 6: Role account check
            role = is_role_account(normalized_email)

            # Step 7: Free provider check
            free_prov = is_free_provider(domain)
            bus_email = is_business_email(domain, free_prov, disposable)

            # Determine Primary Status & Reason
            if not domain_exists:
                status = "Invalid Domain"
                reason = f"Domain '{domain}' does not exist or has no DNS records"
            elif not has_mx:
                status = "No MX Record"
                reason = "Domain exists but has no valid mail server (MX) records"
            elif disposable:
                status = "Disposable"
                reason = "Temporary or disposable email provider domain"
            elif role:
                status = "Role Account"
                reason = "Role-based distribution account (e.g. admin@, support@)"
            elif free_prov:
                status = "Free Provider"
                reason = "Valid email on public free provider (e.g. Gmail, Yahoo)"
            elif bus_email:
                status = "Business Email"
                reason = "Valid corporate or business email address"
            else:
                status = "Valid"
                reason = "Valid email address"

            return EmailRecord(
                job_id=job_id,
                row_index=row_index,
                original_email=original_email,
                normalized_email=normalized_email,
                status=status,
                reason=reason,
                domain=domain,
                has_mx_record=has_mx,
                is_disposable=disposable,
                is_role_account=role,
                is_free_provider=free_prov,
                is_business_email=bus_email,
                is_duplicate=False,
                is_known_duplicate=False,
                is_syntax_valid=True
            )
    except Exception as exc:
        logger.exception(f"Unexpected error processing row {item.get('row_index')}: {exc}")
        return EmailRecord(
            job_id=job_id,
            row_index=item.get("row_index", 0),
            original_email=str(item.get("original_email", "")),
            normalized_email=str(item.get("original_email", "")).lower().strip(),
            status="Invalid Format",
            reason=f"Processing error: {str(exc)}",
            domain="",
            has_mx_record=False,
            is_disposable=False,
            is_role_account=False,
            is_free_provider=False,
            is_business_email=False,
            is_duplicate=False,
            is_known_duplicate=False,
            is_syntax_valid=False
        )

async def run_verification_job(
    job_id: str,
    raw_rows: List[Dict],
    session: AsyncSession
) -> None:
    repo = JobRepository(session)
    await repo.update_job_status(job_id, "processing")

    # Load the global known-email registry once upfront for fast lookup
    known_repo = KnownEmailRepository(session)
    known_emails: Set[str] = await known_repo.get_all_normalized_set()
    logger.info(f"Loaded {len(known_emails)} known emails for job {job_id}")
    
    seen_emails: Set[str] = set()
    lock = asyncio.Lock()
    semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_DNS_LOOKUPS)

    total_items = len(raw_rows)
    chunk_size = 25  # Process in small batches of 25 records for responsive live progress updates
    
    counts = {
        "valid_count": 0,
        "invalid_count": 0,
        "disposable_count": 0,
        "role_count": 0,
        "duplicate_count": 0,
        "free_count": 0,
        "business_count": 0,
        "no_mx_count": 0
    }

    processed_so_far = 0

    try:
        for i in range(0, total_items, chunk_size):
            chunk = raw_rows[i:i + chunk_size]
            tasks = [
                process_single_email(item, job_id, seen_emails, known_emails, lock, semaphore)
                for item in chunk
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            records: List[EmailRecord] = [r for r in results if isinstance(r, EmailRecord)]
            
            # Update counts
            for rec in records:
                if rec.status == "Invalid Format" or rec.status == "Invalid Domain":
                    counts["invalid_count"] += 1
                elif rec.status == "No MX Record":
                    counts["no_mx_count"] += 1
                elif rec.status == "Disposable":
                    counts["disposable_count"] += 1
                elif rec.status in ("Duplicate", "Known Duplicate"):
                    counts["duplicate_count"] += 1
                elif rec.status == "Role Account":
                    counts["role_count"] += 1
                elif rec.status == "Free Provider":
                    counts["free_count"] += 1
                    counts["valid_count"] += 1
                elif rec.status == "Business Email":
                    counts["business_count"] += 1
                    counts["valid_count"] += 1
                elif rec.status == "Valid":
                    counts["valid_count"] += 1

            # Save batch records to DB
            if records:
                await repo.bulk_create_records(records)
            
            processed_so_far += len(chunk)
            await repo.update_job_progress_and_counts(job_id, processed_so_far, counts)

        from datetime import datetime, timezone
        await repo.update_job_status(job_id, "completed", completed_at=datetime.now(timezone.utc))
        logger.info(f"Verification Job {job_id} completed successfully. Total: {total_items}")
    except Exception as e:
        logger.exception(f"Error executing verification job {job_id}: {str(e)}")
        await repo.update_job_status(job_id, "failed", error_message=str(e))
