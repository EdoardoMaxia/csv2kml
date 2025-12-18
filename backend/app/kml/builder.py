from __future__ import annotations

from dataclasses import dataclass
from html import escape
from typing import Iterable, Optional

@dataclass(frozen=True)
class KmlPoint:
    name: str
    lat: float
    lon: float
    description_html: str = ""

@dataclass(frozen=True)
class KmlPointStyle:
    style_id: str = "pointStyle"
    icon_url: Optional[str] = None
    icon_scale: float = 1.0
    icon_color: Optional[str] = None    # already converted to aabbggrr

def build_kml_points(document_name: str, points: Iterable[KmlPoint], style: Optional[KmlPointStyle] = None) -> str:
    """
    Builds a minimal, valid KML document with Point Placemarks.

    Note: KML coordinates are in the order: lon, lat, alt
    """

    style_block = ""
    if style:
        icon_href = escape(style.icon_url) if style.icon_url else ""
        color_tag = f"<color>{escape(style.icon_color)}</color>" if style.icon_color else ""
        icon_tag = f"""
        <Icon>
          <href>{icon_href}</href>
        </Icon>""".rstrip() if style.icon_url else ""

        style_block = f"""
        <Style id="{escape(style.style_id)}">
        <IconStyle>
            {color_tag}
            <scale>{style.icon_scale}</scale>
            {icon_tag}
        </IconStyle>
        </Style>""".rstrip()


    placemarks = []
    for p in points:
        # Escape name, keep description as HTML-safe (we'll escape it too far safety)
        # For example convert "<" → "&lt"
        name = escape(p.name)
        desc = escape(p.description_html)

        style_url_line = f'\n      <styleUrl>#{escape(style.style_id)}</styleUrl>' if style else ""

        placemarks.append(
            f"""
            <Placemark>
            <name>{name}</name>{style_url_line}
            <description><![CDATA[{desc}]]></description>
            <Point>
                <coordinates>{p.lon},{p.lat},0</coordinates>
            </Point>
            </Placemark>""".rstrip()
                )

    placemarks_str = "\n".join(placemarks)

    return f"""<?xml version="1.0" encoding="UTF-8"?>
            <kml xmlns="http://www.opengis.net/kml/2.2">
            <Document>
                <name>{escape(document_name)}</name>{style_block}
            {placemarks_str}
            </Document>
            </kml>
            """

