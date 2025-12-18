from __future__ import annotations

import csv
import io
import json
import re
from typing import Any, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.api.csv import _detect_dialect
from app.kml.builder import KmlPoint, KmlPointStyle, build_kml_points


router = APIRouter(prefix="/kml", tags=["KML"])

_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

class PointsMapping(BaseModel):
    name_col: str = Field(..., min_length=1)
    lat_col: str = Field(..., min_length=1)
    lon_col: str = Field(..., min_length=1)
    description_cols: list[str] = Field(default_factory=list)

    icon_url: Optional[str] = None
    icon_scale: float = 1.0
    icon_color: Optional[str] = None    #expect "#RRGGBB"

def _parse_mapping(mapping_raw: str) -> PointsMapping:
    try:
        data = json.loads(mapping_raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid mapping json")
    
    try:
        return PointsMapping.model_validate(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid mapping schema") from e
    

def _hex_to_kml_color(hex_rgb: str) -> str:
    """
    Converts #RRGGBB to KML color format aabbggrr.
    We'll use full opacity (aa == ff).
    """
    if not _HEX_COLOR_RE.match(hex_rgb):
        raise HTTPException(status_code=400, detail="icon_color must be in format #RRGGBB")

    hex_rgb = hex_rgb.lower()

    rr = hex_rgb[1:3]
    gg = hex_rgb[3:5]
    bb = hex_rgb[5:7]
    aa = "ff"

    return f"{aa}{bb}{gg}{rr}"

@router.post("/points")
async def kml_points(
    file: UploadFile = File(...),
    mapping: str = Form(...),
) -> Response:
    # Basic file checks
    if file.filename is None or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")
    
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Decode
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded (utf-8 or utf-8-sig)")
    

    mapping_obj = _parse_mapping(mapping)

    # CSV dialect detection
    sample = text[:4096]
    dialect = _detect_dialect(sample)

    stream = io.StringIO(text)
    reader = csv.DictReader(stream, dialect=dialect)

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV has no header row.")
    
    headers = [h.strip() for h in reader.fieldnames]

    # Validate required columns exist
    required = [mapping_obj.name_col, mapping_obj.lat_col, mapping_obj.lon_col]
    missing = [c for c in required if c not in headers]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing)}")
    
    for c in mapping_obj.description_cols:
        if c not in headers:
            raise HTTPException(status_code=400, detail=f"Description column not found: {c}")
    
    points: list[KmlPoint] = []

    for idx, row in enumerate(reader, start=1):
        # DictReader keys are headers; values are raw strings
        name = (row.get(mapping_obj.name_col) or "").strip()
        lat_raw = (row.get(mapping_obj.lat_col) or "").strip()
        lon_raw = (row.get(mapping_obj.lon_col) or "").strip()
    
        if not name:
            name = f"Point {idx}"
        
        try:
            lat = float(lat_raw)
            lon = float(lon_raw)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid coordinates at row {idx}: lat='{lat_raw}', lon='{lon_raw}'",
            )
        
        if not (-90.0 <= lat <= 90.0):
            raise HTTPException(status_code=400, detail=f"Latitude out of range at row {idx}: {lat}")
        if not (-180.0 <= lon <= 180.0):
            raise HTTPException(status_code=400, detail=f"Longitude out of range at row {idx}: {lon}")
    
        # Build description from selected columns
        desc_parts: list[str] = []
        for col in mapping_obj.description_cols:
            val = (row.get(col) or "").strip()
            desc_parts.append(f"{col}: {val}")

        description = "<br/>".join(desc_parts)

        points.append(KmlPoint(name=name, lat=lat, lon=lon, description_html=description))
    
    style = None
    if mapping_obj.icon_url or mapping_obj.icon_color or mapping_obj.icon_scale != 1.0:
        kml_color = _hex_to_kml_color(mapping_obj.icon_color) if mapping_obj.icon_color else None

        # basic scale validation
        if mapping_obj.icon_scale <= 0 or mapping_obj.icon_scale > 10:
            raise HTTPException(status_code=400, detail="icon_scale must be between 0 and 10")
        
        style = KmlPointStyle(
            style_id="pointStyle",
            icon_url=mapping_obj.icon_url,
            icon_scale=mapping_obj.icon_scale,
            icon_color=kml_color,
        )

    kml = build_kml_points(document_name=file.filename or "csv2kml", points=points, style=style)

    out_name = (file.filename or "points.csv").rsplit(".", 1)[0] + ".kml"

    return Response(
        content=kml,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
    )
