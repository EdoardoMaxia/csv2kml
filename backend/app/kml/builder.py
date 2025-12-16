from __future__ import annotations

from dataclasses import dataclass
from html import escape
from typing import Iterable

@dataclass(frozen=True)
class KmlPoint:
    name: str
    lat: float
    lon: float
    description_html: str = ""

def build_kml_points(document_name: str, points: Iterable[KmlPoint]) -> str:
    """
    Builds a minimal, valid KML document with Point Placemarks.

    Note: KML coordinates are in the order: lon, lat, alt
    """

    placemarks = []
    for p in points:
        # Escape name, keep description as HTML-safe (we'll escape it too far safety)
        name = escape(p.name)
        desc = escape(p.description_html)

        placemarks.append(
            f"""
                <Placemark>
                    <name>{name}</name>
                    <description><![CDATA[{desc}]]</description>
                    <Point>
                        <coordinates>{p.lon},{p.lat},0</coordinates>
                    </Point>
                </Placemark>
            """.rstrip()
        )

    
    placemarks_str = "\n".join(placemarks)

    # Minimal KML structure
    return f"""
                <?xml version="1.0" encoding="UTF-8"?>
                <kml xmlns="http://www.opengis.net/kml/2.2">
                    <Document>
                        <name>{escape(document_name)}</name>
                        {placemarks_str}
                    </Document>
                </kml>
            """

