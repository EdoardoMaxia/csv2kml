from __future__ import annotations

import textwrap

from dataclasses import dataclass
from html import escape
from typing import Iterable, Optional


@dataclass(frozen=True)
class KmlLink:
    name: str
    a_lat: float
    a_lon: float
    b_lat: float
    b_lon: float
    description_html: str = ""


@dataclass(frozen=True)
class KmlLineStyle:
    style_id: str = "lineStyle"
    color: Optional[str] = None # KML aabbggrr
    width: float = 2.0


def build_kml_links(document_name: str, links: Iterable[KmlLink], style: Optional[KmlLineStyle] = None) -> str:
    style_block = ""
    if style:
        color_tag = f"<color>{escape(style.color)}</color>" if style.color else ""
        style_block = f"""
        <Style id="{escape(style.style_id)}">
            <LineStyle>
                {color_tag}
                <width>{style.width}</width>
            </LineStyle>
        </Style>
        """.rstrip()
    
    placemarks = []
    for l in links:
        name = escape(l.name)
        desc = escape(l.description_html)
        style_url_line = f'\n      <styleUrl>#{escape(style.style_id)}</styleUrl>' if style else ""

        # LineString coordinates: lon,lat,alt for each vertex
        coords = f"{l.a_lon},{l.a_lat},0 {l.b_lon},{l.b_lat},0"

        placemarks.append(
            textwrap.dedent(f"""\
                <Placemark>
                    <name>{escape(name)}</name>{style_url_line}
                    <description><![CDATA[{desc}]]></description>
                    <LineString>
                        <tessellate>1</tessellate>
                        <coordinates>{coords}</coordinates>
                    </LineString>
                </Placemark>
            """).rstrip()
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
