from __future__ import annotations

import csv
import io
from typing import Any, Union, Type

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/csv", tags=["CSV"])

def _detect_dialect(sample: str) -> Union[csv.Dialect, Type[csv.Dialect]]:
    """
    Tries to detect CSV delimiter/quoting using a small sample.
    Falls back to Excel dialect if detection fails.
    """
    sniffer = csv.Sniffer()
    try:
        return sniffer.sniff(sample)
    except csv.Error:
        return csv.excel

@router.post("/preview")
async def preview_csv(file: UploadFile = File(...), max_rows: int = 20) -> dict[str, Any]:
    """
    Return headers + first N rows of a CSV file.

    - file: uploaded CSV
    - max_rows: how many rows to return (default 20)
    """

    if max_rows < 1 or max_rows > 200:
        raise HTTPException(status_code=400, detail="max_rows must be between 1 and 200")
    
    # Basic file type check (not bulletproof, but useful)
    if file.filename is None or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")
    
    # Decode (start simple: UTF-8 with BOM support)
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded (utf-8 or utf-8-sig)")
    
    # Detect dialect from a small sample
    sample = text[:4096]
    dialect = _detect_dialect(sample)

    stream = io.StringIO(text)
    reader = csv.reader(stream, dialect=dialect)

    try:
        headers = next(reader)
    except StopIteration:
        raise HTTPException(status_code=400, detail="CSV has no rows")
    
    headers = [h.strip() for h in headers]
    if not any(headers):
        raise HTTPException(status_code=400, detail="CSV header row is empty.")
    
    rows: list[list[str]] = []
    for i, row in enumerate(reader):
        if i >= max_rows:
            break
        rows.append([cell.strip() for cell in row])
    
    return {
        "filename" : file.filename,
        "headers" : headers,
        "rows" : rows,
        "max_rows" : max_rows,
        "detected_delimiter" : getattr(dialect, "delimiter", ","),
    }