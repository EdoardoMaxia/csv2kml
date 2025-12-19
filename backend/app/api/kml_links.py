from __future__ import annotations

import csv
import io
import json
import re
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.api.csv import _detect_dialect
from app.kml.links_builder import KmlLink, KmlLineStyle, build_kml_links

router = APIRouter(prefix="/kml", tags=["KML"])

_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _hex_to_kml_color(hex_rgb: str) -> str:
    """#RRGGBB -> aabbggrr (opaque)"""
    hex_rgb = hex_rgb.strip()
    if not _HEX_COLOR_RE.match(hex_rgb):
        raise HTTPException(status_code=400, detail="line_color must be in format #RRGGBB")
    hex_rgb = hex_rgb.lower()
    rr = hex_rgb[1:3]
    gg = hex_rgb[3:5]
    bb = hex_rgb[5:7]
    return f"ff{bb}{gg}{rr}"

def _parse_mapping(mapping_raw: str) -> LinksMapping:
    try:
        data = json.loads(mapping_raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid mapping JSON")
    
    try:
        return LinksMapping.model_validate(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid mapping schema") from e


class LinksMapping(BaseModel):
    # endpoint A columns
    a_lat_col: str = Field(..., min_length=1)
    a_lon_col: str = Field(..., min_length=1)

    # endpoint B columns
    b_lat_col: str = Field(..., min_length=1)
    b_lon_col: str = Field(..., min_length=1)

    # optional naming/description
    link_name_col: Optional[str] = None
    description_cols: list[str] = Field(default_factory=list)

    # optional style
    line_color: Optional[str] = None # "#RRGGBB"
    line_width: float = 2.0


@router.post("/links")
async def kml_links(file: UploadFile = File(...), mapping: str = Form(...)) -> Response:
    if file.filename is None or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded (utf-8 or utf-8-sig)")

    m = _parse_mapping(mapping)

    # style validation
    if m.line_width <= 0 or m.line_width > 50:
        raise HTTPException(status_code=400, detail="line_width must be between 0 and 50")
    
    line_style = None
    if m.line_color or m.line_width !=2.0:
        kml_color = _hex_to_kml_color(m.line_color) if m.line_color else None
        line_style = KmlLineStyle(style_id="lineStyle", color=kml_color, width=m.line_width)
    
    dialect = _detect_dialect(text[:4096])
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV has no header now.")

    headers = [h.strip() for h in reader.fieldnames]

    required = [m.a_lat_col, m.a_lon_col, m.b_lat_col, m.b_lon_col]
    missing = [c for c in required if c not in headers]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")
    
    for c in m.description_cols:
        if c not in headers:
            raise HTTPException(status_code=400, detail=f"Description column not found: {c}")
    

    links: list[KmlLink] = []

    for idx, row in enumerate(reader, start=1):
        a_lat_raw = (row.get(m.a_lat_col) or "").strip()
        a_lon_raw = (row.get(m.a_lon_col) or "").strip()
        b_lat_raw = (row.get(m.b_lat_col) or "").strip()
        b_lon_raw = (row.get(m.b_lon_col) or "").strip()

        try:
            a_lat = float(a_lat_raw)
            a_lon = float(a_lon_raw)
            b_lat = float(b_lat_raw)
            b_lon = float(b_lon_raw)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid coordinates at row {idx}: "
                    f"A=({a_lat_raw},{a_lon_raw}) B=({b_lat_raw},{b_lon_raw})",
            )
        
        # range cheks
        for lat, lon, label in [(a_lat, a_lon, "A"), (b_lat, b_lon, "B")]:
            if not (-90.0 <= lat <= 90.0):
                raise HTTPException(status_code=400, detail=f"Latitude out of range at row {idx} ({label}): {lat}")
            if not (-180.0 <= lon <= 180.0):
                raise HTTPException(status_code=400, detail=f"Longitude out of range at row {idx} ({label}): {lon}")
        
        # name
        if m.link_name_col:
            name = ((row.get(m.link_name_col) or "").strip()) or f"Link {idx}"
        else:
            name = f"Link {idx}"
        
        # description
        desc_parts = []
        for c in m.description_cols:
            desc_parts.append(f"{c}: {(row.get(c) or '').strip()}")
        description = "<br/>".join(desc_parts)

        links.append(
            KmlLink(
                name=name,
                a_lat=a_lat,
                a_lon=a_lon,
                b_lat=b_lat,
                b_lon=b_lon,
                description_html=description,
            )
        )

    kml = build_kml_links(document_name=file.filename or "csv2kml-links", links=links, style=line_style)

    out_name = (file.filename or "links.csv").rsplit(".", 1)[0] + "_links.kml"
    return Response(
        content=kml,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
    )