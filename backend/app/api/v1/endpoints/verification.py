import os
import uuid
import aiofiles
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.database import get_db, AsyncSessionLocal
from app.repositories.job_repository import JobRepository
from app.services.parser_service import parse_uploaded_file
from app.services.verifier_service import run_verification_job
from app.services.export_service import generate_export_files

router = APIRouter()

async def background_worker_task(job_id: str, raw_rows: List[dict]):
    """
    Background worker creating its own DB session for async execution.
    """
    async with AsyncSessionLocal() as session:
        await run_verification_job(job_id, raw_rows, session)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload CSV or Excel file containing email addresses.
    Validates format, saves file, parses content, and returns preview.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Save file safely to uploads directory
    job_uuid = str(uuid.uuid4())
    safe_filename = f"{job_uuid}{ext}"
    file_path = settings.UPLOAD_DIR / safe_filename

    try:
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(content)

        # Parse file to extract emails
        raw_rows, detected_column = parse_uploaded_file(str(file_path))
        
        # Create Job in DB
        repo = JobRepository(db)
        job = await repo.create_job(
            filename=safe_filename,
            original_filename=file.filename,
            file_path=str(file_path),
            total_emails=len(raw_rows)
        )

        preview = raw_rows[:10]  # First 10 rows for preview

        return {
            "job_id": job.id,
            "filename": file.filename,
            "detected_column": detected_column,
            "total_emails": len(raw_rows),
            "preview": preview,
            "status": job.status
        }
    except ValueError as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process file upload: {str(e)}")

@router.post("/verify/{job_id}")
async def start_verification(
    job_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Start background verification process for an uploaded job.
    """
    repo = JobRepository(db)
    job = await repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Verification job not found.")

    if job.status == "processing":
        return {"message": "Job is already processing.", "job_id": job.id, "status": job.status}

    # Update DB status synchronously so immediate GET /job/{job_id} queries see 'processing'
    await repo.update_job_status(job.id, "processing")

    # Re-parse raw rows from saved file
    raw_rows, _ = parse_uploaded_file(job.file_path)

    # Launch background worker
    background_tasks.add_task(background_worker_task, job.id, raw_rows)

    return {
        "message": "Verification job started successfully.",
        "job_id": job.id,
        "status": "processing"
    }

@router.get("/job/{job_id}")
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current progress and status of verification job.
    """
    repo = JobRepository(db)
    job = await repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    progress_percentage = 0
    if job.total_emails > 0:
        progress_percentage = round((job.processed_emails / job.total_emails) * 100, 1)

    return {
        "job_id": job.id,
        "filename": job.original_filename,
        "total_emails": job.total_emails,
        "processed_emails": job.processed_emails,
        "progress_percentage": progress_percentage,
        "status": job.status,
        "error_message": job.error_message,
        "created_at": job.created_at,
        "completed_at": job.completed_at,
        "stats": {
            "valid": job.valid_count,
            "invalid": job.invalid_count,
            "disposable": job.disposable_count,
            "role": job.role_count,
            "duplicate": job.duplicate_count,
            "free": job.free_count,
            "business": job.business_count,
            "no_mx": job.no_mx_count
        }
    }

@router.get("/statistics/{job_id}")
async def get_job_statistics(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistical dashboard metrics for job.
    """
    repo = JobRepository(db)
    job = await repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {
        "job_id": job.id,
        "filename": job.original_filename,
        "total_emails": job.total_emails,
        "processed_emails": job.processed_emails,
        "valid": job.valid_count,
        "invalid": job.invalid_count,
        "disposable": job.disposable_count,
        "role": job.role_count,
        "duplicate": job.duplicate_count,
        "free": job.free_count,
        "business": job.business_count,
        "no_mx": job.no_mx_count
    }

@router.get("/results/{job_id}")
async def get_job_results(
    job_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated email verification results with optional search query & status filter.
    """
    repo = JobRepository(db)
    job = await repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    offset = (page - 1) * limit
    records, total_matching = await repo.get_records_by_job_id(
        job_id=job_id,
        limit=limit,
        offset=offset,
        status_filter=status,
        search_query=search
    )

    items = []
    for rec in records:
        items.append({
            "id": rec.id,
            "row_index": rec.row_index,
            "original_email": rec.original_email,
            "normalized_email": rec.normalized_email,
            "status": rec.status,
            "reason": rec.reason,
            "domain": rec.domain,
            "has_mx_record": rec.has_mx_record,
            "is_disposable": rec.is_disposable,
            "is_role_account": rec.is_role_account,
            "is_free_provider": rec.is_free_provider,
            "is_business_email": rec.is_business_email,
            "is_duplicate": rec.is_duplicate,
            "is_known_duplicate": rec.is_known_duplicate,
            "is_syntax_valid": rec.is_syntax_valid
        })

    total_pages = (total_matching + limit - 1) // limit if limit > 0 else 1

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total_matching,
        "total_pages": total_pages
    }

@router.get("/download/csv/{job_id}")
async def download_csv(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Export and download full verification report in CSV format.
    Includes ALL emails (valid, invalid, duplicate, etc.) highlighted with exact statuses.
    """
    repo = JobRepository(db)
    job = await repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    records = await repo.get_all_records_for_export(job_id)
    files = generate_export_files(job_id, records)

    return FileResponse(
        path=files["csv_path"],
        filename=files["csv_filename"],
        media_type="text/csv"
    )

@router.get("/download/excel/{job_id}")
async def download_excel(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Export and download full verification report in Excel format.
    Includes ALL emails (valid, invalid, duplicate, etc.) highlighted with exact statuses.
    """
    repo = JobRepository(db)
    job = await repo.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    records = await repo.get_all_records_for_export(job_id)
    files = generate_export_files(job_id, records)

    return FileResponse(
        path=files["excel_path"],
        filename=files["excel_filename"],
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.get("/history")
async def get_job_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of past verification jobs.
    """
    repo = JobRepository(db)
    jobs = await repo.list_jobs(limit=limit, offset=offset)
    return [
        {
            "job_id": j.id,
            "filename": j.original_filename,
            "total_emails": j.total_emails,
            "processed_emails": j.processed_emails,
            "status": j.status,
            "created_at": j.created_at,
            "completed_at": j.completed_at,
            "stats": {
                "valid": j.valid_count,
                "invalid": j.invalid_count,
                "disposable": j.disposable_count,
                "role": j.role_count,
                "duplicate": j.duplicate_count,
                "free": j.free_count,
                "business": j.business_count,
                "no_mx": j.no_mx_count
            }
        }
        for j in jobs
    ]
