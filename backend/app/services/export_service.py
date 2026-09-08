import os
import pandas as pd
from typing import List
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from app.models.email_record import EmailRecord
from app.core.config import settings

def is_overall_valid(status: str) -> bool:
    return status in ("Valid", "Business Email", "Free Provider")

def generate_export_files(job_id: str, records: List[EmailRecord]) -> dict:
    """
    Generates CSV and Excel export files for a completed verification job
    with visual color highlights for valid and invalid emails.
    """
    data = []
    for rec in records:
        overall_status = "VALID" if is_overall_valid(rec.status) else "INVALID"
        data.append({
            "Original Email": rec.original_email,
            "Normalized Email": rec.normalized_email,
            "Overall Quality": overall_status,
            "Status": rec.status,
            "Reason": rec.reason or "",
            "Domain": rec.domain or "",
            "MX Record": "Yes" if rec.has_mx_record else "No",
            "Disposable": "Yes" if rec.is_disposable else "No",
            "Role Account": "Yes" if rec.is_role_account else "No",
            "Free Provider": "Yes" if rec.is_free_provider else "No",
            "Business Email": "Yes" if rec.is_business_email else "No",
            "Duplicate": "Yes" if rec.is_duplicate else "No",
            "Syntax Valid": "Yes" if rec.is_syntax_valid else "No"
        })

    df = pd.DataFrame(data)

    csv_filename = f"email_verification_report_{job_id}.csv"
    excel_filename = f"email_verification_report_{job_id}.xlsx"

    csv_path = settings.EXPORT_DIR / csv_filename
    excel_path = settings.EXPORT_DIR / excel_filename

    # Export CSV
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")

    # Export Excel with openpyxl styling and cell color highlights
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Verification Report"

    # Define Color Fills & Fonts
    header_fill = PatternFill(start_color="1F497D", end_color="1F497D", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    
    # Row fills based on status
    valid_fill = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")  # Soft Green
    valid_font = Font(name="Calibri", size=11, color="276A3C")
    
    invalid_fill = PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid") # Soft Red/Orange
    invalid_font = Font(name="Calibri", size=11, color="C65911", bold=True)
    
    disposable_fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid") # Soft Yellow
    disposable_font = Font(name="Calibri", size=11, color="7F6000")
    
    duplicate_fill = PatternFill(start_color="E1D5E7", end_color="E1D5E7", fill_type="solid") # Soft Purple
    duplicate_font = Font(name="Calibri", size=11, color="60497A")

    thin_border = Border(
        left=Side(style='thin', color='D9D9D9'),
        right=Side(style='thin', color='D9D9D9'),
        top=Side(style='thin', color='D9D9D9'),
        bottom=Side(style='thin', color='D9D9D9')
    )

    # Write Header Row
    headers = list(df.columns)
    ws.append(headers)
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Write Data Rows & Apply Highlight Styles
    for row_idx, row_data in enumerate(df.values.tolist(), start=2):
        ws.append(row_data)
        status_val = row_data[3]  # Status column
        overall_val = row_data[2] # Overall Quality column
        
        if overall_val == "VALID":
            row_fill = valid_fill
            row_font = valid_font
        elif status_val == "Disposable":
            row_fill = disposable_fill
            row_font = disposable_font
        elif status_val == "Duplicate":
            row_fill = duplicate_fill
            row_font = duplicate_font
        else:  # Invalid Format, Invalid Domain, No MX Record
            row_fill = invalid_fill
            row_font = invalid_font

        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_num)
            cell.fill = row_fill
            cell.font = row_font
            cell.border = thin_border
            
            # Center align short status columns
            if headers[col_num - 1] in ["Overall Quality", "Status", "MX Record", "Disposable", "Role Account", "Free Provider", "Business Email", "Duplicate", "Syntax Valid"]:
                cell.alignment = Alignment(horizontal="center", vertical="center")

    # Auto-adjust column widths so text is never truncated
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    wb.save(excel_path)

    return {
        "csv_path": str(csv_path),
        "excel_path": str(excel_path),
        "csv_filename": csv_filename,
        "excel_filename": excel_filename
    }
