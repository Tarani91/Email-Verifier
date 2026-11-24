import os
import pandas as pd
from typing import List, Dict, Tuple, Any

def detect_email_column(df: pd.DataFrame) -> str:
    """
    Detects the email column from DataFrame headers or content.
    """
    if df.columns is None or len(df.columns) == 0:
        raise ValueError("File has no columns.")

    # 1. Search by header names
    candidate_headers = ["email", "e-mail", "email_address", "emailaddress", "mail", "emails"]
    for col in df.columns:
        if str(col).strip().lower() in candidate_headers:
            return str(col)
            
    # 2. Search by substring in header
    for col in df.columns:
        if "email" in str(col).strip().lower() or "mail" in str(col).strip().lower():
            return str(col)

    # 3. Search first few rows content for '@' symbol
    for col in df.columns:
        sample_vals = df[col].dropna().astype(str).head(10)
        if any("@" in val for val in sample_vals):
            return str(col)

    # 4. Default to first column
    return str(df.columns[0])

def parse_uploaded_file(file_path: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    Parses a CSV or Excel file and extracts raw emails with row indices.
    Returns: (list of dicts [{'row_index': 0, 'original_email': '...'}], detected_column_name)
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext == ".csv":
            try:
                df = pd.read_csv(file_path, dtype=str, skip_blank_lines=True)
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, dtype=str, skip_blank_lines=True, encoding="latin1", on_bad_lines='skip')
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path, dtype=str)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
    except pd.errors.EmptyDataError:
        raise ValueError("Uploaded file is empty.")
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Could not parse file: {str(e)}")

    if df is None or df.empty:
        raise ValueError("Uploaded file contains no data.")

    email_col = detect_email_column(df)
    
    extracted_rows = []
    for idx, row in df.iterrows():
        raw_val = row[email_col]
        # Ignore completely empty or NaN values
        if pd.isna(raw_val) or str(raw_val).strip() == "" or str(raw_val).strip().lower() == "nan":
            continue
        extracted_rows.append({
            "row_index": int(idx),
            "original_email": str(raw_val).strip()
        })

    if not extracted_rows:
        raise ValueError("No email addresses found in the file.")

    return extracted_rows, email_col
