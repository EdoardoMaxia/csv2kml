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
class KmlLink:
    name: str
    a_lat: float
    a_lon: float
    b_lat: float
    b_lon: float
    description_html: str = ""


@dataclass(frozen=True)
class KmlPointStyle:
    style_id: str = "pointStyle"
    icon_url: Optional[str] = None
    icon_scale: float = 1.0
    icon_color: Optional[str] = None #aabbggrr


@dataclass(frozen=True)
class KmlLineStyle:
    style_id: str = "lineStyle"
    color: Optional[str] = None #aabbggrr
    width: float = 2.0


def _build_point_style(style: KmlPointStyle) -> str:
    color_tag = f"<color>{escape(style.icon_color)}</color>" if style.icon_color else ""
    icon_tag = ""
    if style.icon_url:
        icon_tag = f"""
        <Icon>
          <href>{escape(style.icon_url)}</href>
        </Icon>""".rstrip()

    return f"""
    <Style id="{escape(style.style_id)}">
      <IconStyle>
        {color_tag}
        <scale>{style.icon_scale}</scale>
        {icon_tag}
      </IconStyle>
    </Style>""".rstrip()


def _build_line_style(style: KmlLineStyle) -> str:
    color_tag = f"<color>{escape(style.color)}</color>" if style.color else ""
    return f"""
    <Style id="{escape(style.style_id)}">
      <LineStyle>
        {color_tag}
        <width>{style.width}</width>
      </LineStyle>
    </Style>""".rstrip()


def build_kml_graph(
    document_name: str,
    points: Iterable[KmlPoint],
    links: Iterable[KmlLink],
    point_style: Optional[KmlPointStyle] = None,
    line_style: Optional[KmlLineStyle] = None,
) -> str:
    styles = []
    if point_style:
        styles.append(_build_point_style(point_style))
    if line_style:
        styles.append(_build_line_style(line_style))
    styles_block = "\n".join(styles)

    point_placemarks = []
    for p in points:
        name = escape(p.name)
        desc = escape(p.description_html)
        style_url = f"\n      <styleUrl>#{escape(point_style.style_id)}</styleUrl>" if point_style else ""
        point_placemarks.append(
            f"""
      <Placemark>
        <name>{name}</name>{style_url}
        <description><![CDATA[{desc}]]></description>
        <Point>
          <coordinates>{p.lon},{p.lat},0</coordinates>
        </Point>
      </Placemark>""".rstrip()
        )

    link_placemarks = []
    for l in links:
        name = escape(l.name)
        desc = escape(l.description_html)
        style_url = f"\n      <styleUrl>#{escape(line_style.style_id)}</styleUrl>" if line_style else ""
        coords = f"{l.a_lon},{l.a_lat},0 {l.b_lon},{l.b_lat},0"
        link_placemarks.append(
            f"""
      <Placemark>
        <name>{name}</name>{style_url}
        <description><![CDATA[{desc}]]></description>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>{coords}</coordinates>
        </LineString>
      </Placemark>""".rstrip()
        )

    points_block = "\n".join(point_placemarks)
    links_block = "\n".join(link_placemarks)

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>{escape(document_name)}</name>
{styles_block}
    <Folder>
      <name>Points</name>
{points_block}
    </Folder>
    <Folder>
      <name>Links</name>
{links_block}
    </Folder>
  </Document>
</kml>
"""