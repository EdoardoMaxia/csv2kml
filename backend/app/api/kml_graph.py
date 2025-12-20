from __future__ import annotations

import csv
import io
import json
import re
from typing import Literal, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.api.csv import _detect_dialect
from app.kml.graph_builder import (
    KmlLink,
    KmlLineStyle,
    KmlPoint,
    KmlPointStyle,
    build_kml_graph,
)

router = APIRouter(prefix="/kml", tags=["KML"])

_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _hex_to_kml_color(hex_rgb: str, field_name: str) -> str:
    """#RRGGBB -> aabbggrr (opaque, lowercase)"""
    hex_rgb = hex_rgb.strip()
    if not _HEX_COLOR_RE.match(hex_rgb):
        raise HTTPException(status_code=400, detail=f"{field_name} must be in format #RRGGBB")
    hex_rgb = hex_rgb.lower()
    rr = hex_rgb[1:3]
    gg = hex_rgb[3:5]
    bb = hex_rgb[5:7]
    return f"ff{bb}{gg}{rr}"


class GraphNodeSpec(BaseModel):
    name_col: str = Field(..., min_length=1)
    lat_col: str = Field(..., min_length=1)
    lon_col: str = Field(..., min_length=1)


class GraphPointsConfig(BaseModel):
    nodes: list[GraphNodeSpec] = Field(..., min_length=1)
    description_cols: list[str] = Field(default_factory=list)

    # optional style
    icon_url: Optional[str] = None
    icon_scale: float = 1.0
    icon_color: Optional[str] = None  # "#RRGGBB"


class GraphLinksConfig(BaseModel):
    a_lat_col: str = Field(..., min_length=1)
    a_lon_col: str = Field(..., min_length=1)
    b_lat_col: str = Field(..., min_length=1)
    b_lon_col: str = Field(..., min_length=1)

    link_name_col: Optional[str] = None
    description_cols: list[str] = Field(default_factory=list)

    # optional style
    line_color: Optional[str] = None  # "#RRGGBB"
    line_width: float = 2.0


class DedupeConfig(BaseModel):
    mode: Literal["coords", "name"] = "coords"
    precision: int = 6


class GraphMapping(BaseModel):
    points: GraphPointsConfig
    links: GraphLinksConfig
    dedupe: DedupeConfig = Field(default_factory=DedupeConfig)


def _parse_mapping(mapping_raw: str) -> GraphMapping:
    try:
        data = json.loads(mapping_raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid mapping JSON")

    try:
        return GraphMapping.model_validate(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid mapping schema") from e


def _parse_float(value: str, row_idx: int, field: str) -> float:
    try:
        return float(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {field} at row {row_idx}: {value}")


def _validate_lat_lon(lat: float, lon: float, row_idx: int, label: str) -> None:
    if not (-90.0 <= lat <= 90.0):
        raise HTTPException(status_code=400, detail=f"Latitude out of range at row {row_idx} ({label}): {lat}")
    if not (-180.0 <= lon <= 180.0):
        raise HTTPException(status_code=400, detail=f"Longitude out of range at row {row_idx} ({label}): {lon}")


@router.post("/graph")
async def kml_graph(file: UploadFile = File(...), mapping: str = Form(...)) -> Response:
    if file.filename is None or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded (utf-8 or utf-8-sig)")

    m = _parse_mapping(mapping)

    # Validate styles
    if m.points.icon_scale <= 0 or m.points.icon_scale > 10:
        raise HTTPException(status_code=400, detail="icon_scale must be between 0 and 10")
    if m.links.line_width <= 0 or m.links.line_width > 50:
        raise HTTPException(status_code=400, detail="line_width must be between 0 and 50")
    if m.dedupe.precision < 0 or m.dedupe.precision > 12:
        raise HTTPException(status_code=400, detail="dedupe.precision must be between 0 and 12")

    point_style = None
    if m.points.icon_url or m.points.icon_color or m.points.icon_scale != 1.0:
        kml_color = _hex_to_kml_color(m.points.icon_color, "icon_color") if m.points.icon_color else None
        point_style = KmlPointStyle(
            style_id="pointStyle",
            icon_url=m.points.icon_url,
            icon_scale=m.points.icon_scale,
            icon_color=kml_color,
        )

    line_style = None
    if m.links.line_color or m.links.line_width != 2.0:
        kml_color = _hex_to_kml_color(m.links.line_color, "line_color") if m.links.line_color else None
        line_style = KmlLineStyle(style_id="lineStyle", color=kml_color, width=m.links.line_width)

    # Parse CSV once
    dialect = _detect_dialect(text[:4096])
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV has no header row")

    headers = [h.strip() for h in reader.fieldnames]

    # Column validation (points)
    for node in m.points.nodes:
        for c in [node.name_col, node.lat_col, node.lon_col]:
            if c not in headers:
                raise HTTPException(status_code=400, detail=f"Missing required column: {c}")

    for c in m.points.description_cols:
        if c not in headers:
            raise HTTPException(status_code=400, detail=f"Description column not found: {c}")

    # Column validation (links)
    for c in [m.links.a_lat_col, m.links.a_lon_col, m.links.b_lat_col, m.links.b_lon_col]:
        if c not in headers:
            raise HTTPException(status_code=400, detail=f"Missing required column: {c}")

    if m.links.link_name_col and m.links.link_name_col not in headers:
        raise HTTPException(status_code=400, detail=f"link_name_col not found: {m.links.link_name_col}")

    for c in m.links.description_cols:
        if c not in headers:
            raise HTTPException(status_code=400, detail=f"Description column not found: {c}")

    # Build points (deduped) + links
    points_by_key: dict[str, KmlPoint] = {}
    links: list[KmlLink] = []

    for idx, row in enumerate(reader, start=1):
        # links
        a_lat = _parse_float((row.get(m.links.a_lat_col) or "").strip(), idx, m.links.a_lat_col)
        a_lon = _parse_float((row.get(m.links.a_lon_col) or "").strip(), idx, m.links.a_lon_col)
        b_lat = _parse_float((row.get(m.links.b_lat_col) or "").strip(), idx, m.links.b_lat_col)
        b_lon = _parse_float((row.get(m.links.b_lon_col) or "").strip(), idx, m.links.b_lon_col)

        _validate_lat_lon(a_lat, a_lon, idx, "A")
        _validate_lat_lon(b_lat, b_lon, idx, "B")

        if m.links.link_name_col:
            link_name = ((row.get(m.links.link_name_col) or "").strip()) or f"Link {idx}"
        else:
            link_name = f"Link {idx}"

        link_desc_parts = []
        for c in m.links.description_cols:
            link_desc_parts.append(f"{c}: {(row.get(c) or '').strip()}")
        link_desc = "<br/>".join(link_desc_parts)

        links.append(
            KmlLink(
                name=link_name,
                a_lat=a_lat,
                a_lon=a_lon,
                b_lat=b_lat,
                b_lon=b_lon,
                description_html=link_desc,
            )
        )

        # points from each node spec
        for node in m.points.nodes:
            name = ((row.get(node.name_col) or "").strip()) or "Unnamed"
            lat = _parse_float((row.get(node.lat_col) or "").strip(), idx, node.lat_col)
            lon = _parse_float((row.get(node.lon_col) or "").strip(), idx, node.lon_col)
            _validate_lat_lon(lat, lon, idx, name)

            point_desc_parts = []
            for c in m.points.description_cols:
                point_desc_parts.append(f"{c}: {(row.get(c) or '').strip()}")
            point_desc = "<br/>".join(point_desc_parts)

            if m.dedupe.mode == "coords":
                key = f"{round(lat, m.dedupe.precision)},{round(lon, m.dedupe.precision)}"
            else:
                key = name.strip().lower()

            # keep first occurrence (simple + deterministic)
            if key not in points_by_key:
                points_by_key[key] = KmlPoint(name=name, lat=lat, lon=lon, description_html=point_desc)

    points = list(points_by_key.values())

    out_name = (file.filename or "graph.csv").rsplit(".", 1)[0] + "_graph.kml"
    kml = build_kml_graph(
        document_name=file.filename or "csv2kml-graph",
        points=points,
        links=links,
        point_style=point_style,
        line_style=line_style,
    )

    return Response(
        content=kml,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
    )
