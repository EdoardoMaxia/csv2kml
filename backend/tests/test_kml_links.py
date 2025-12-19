import json
import xml.etree.ElementTree as ET

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_kml_links_happy_path():
    csv_content = "a_lat,a_lon,b_lat,b_lon,name\n41.9,12.5,40.8,14.3,AB Link\n"
    mapping = {
        "a_lat_col": "a_lat",
        "a_lon_col": "a_lon",
        "b_lat_col": "b_lat",
        "b_lon_col": "b_lon",
        "link_name_col": "name",
        "description_cols": [],
        "line_color": "#00AAFF",
        "line_width": 3.5,
    }

    files = {"file": ("links.csv", csv_content, "text/csv")}
    data = {"mapping": json.dumps(mapping)}
    r = client.post("/kml/links", files=files, data=data)

    assert r.status_code == 200
    body = r.text
    ET.fromstring(body)
    assert "<LineString>" in body
    assert "<styleUrl>#lineStyle</styleUrl>" in body
    assert "<width>3.5</width>" in body
    # #00AAFF -> ff ff aa 00 => ffffaa00
    assert "<color>ffffaa00</color>" in body
    # coordinates must be lon,lat,0 lon,lat,0
    assert "<coordinates>12.5,41.9,0 14.3,40.8,0</coordinates>" in body


def test_kml_links_missing_column():
    csv_content = "a_lat,a_lon,b_lat\n41.9,12.5,40.8\n"
    mapping = {
        "a_lat_col": "a_lat",
        "a_lon_col": "a_lon",
        "b_lat_col": "b_lat",
        "b_lon_col": "b_lon",
    }

    files = {"file": ("links.csv", csv_content, "text/csv")}
    data = {"mapping": json.dumps(mapping)}
    r = client.post("/kml/links", files=files, data=data)

    assert r.status_code == 400
    assert "Missing required columns" in r.json()["detail"]
